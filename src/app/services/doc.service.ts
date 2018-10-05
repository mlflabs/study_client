import { Injectable, EventEmitter } from '@angular/core';
import { Doc } from '../models/doc.model';
import { Observable, Observer, Subject, BehaviorSubject, from, of, range, fromEvent, observable } from 'rxjs';
import { map, filter, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { nSQL } from 'nano-sql';
import { FeathersService } from './feathers.service';
import { nsend, timeout } from '../../../node_modules/@types/q';
const ObjectID = require('bson-objectid');
import { isEqual } from 'lodash';
import { diff } from 'deep-diff';
const equal = require('fast-deep-equal');
import { deepCompare } from '../utils';
import { AuthService } from './auth.service';


export const DOC_CHANGES_STREM = 'changes_stream';
export const _COLLECTION_DELETED_SUFIX = '_deleted';
export const EVENT_SERVICE = 'events';
export const GROUP_SERVICE = 'groups';

// const  uniqid = require('uniqid');
export interface ServerEvent {
  type: string;
  message: string;
  collection: string;
  e?: {};
  doc?: {};
}

@Injectable({
  providedIn: 'root'
})
export  class DocService {

  private feathersService;

  public events: Subject<ServerEvent> = new Subject();
  
  constructor(private _feathers: FeathersService,
              public authService: AuthService) {

    //lets generate our subscriptions
    this.feathersService = [];
    for(let i=0; i < environment.collections.length; i++){ 
      this.feathersService[environment.collections[i]] = _feathers.getService(environment.collections[i]);
      this.feathersService[environment.collections[i]]
        .on('created', doc => this._server_onLoadDataFromServer(doc, environment.collections[i]));
      this.feathersService[environment.collections[i]]
        .on('updated', doc => this._server_onLoadDataFromServer(doc,environment.collections[i]));
      this.feathersService[environment.collections[i]]
        .on('removed', doc => this._server_onRemove(doc, environment.collections[i]));

      //setup database
      nSQL(environment.collections[i])
        .model([
          { key: 'id', type: 'string', props: ['pk'] },
          { key: 'meta_newid', type: 'bool', default: false },
          { key: 'meta_removed', type: 'bool', default: false },
          { key: 'meta_dirty', type: 'bool', default: false },
          { key: '*', type: '*'}
        ]).config({
          mode: 'PERM' // autodetect best method and persist data.
        });

        nSQL(environment.collections[i]+_COLLECTION_DELETED_SUFIX )
        .model([
          { key: 'id', type: 'timeIdms', props: ['pk'] },
          { key: '*', type: '*' }
        ]).config({
          mode: 'PERM' // autodetect best method and persist data.
        });

        nSQL(environment.collections[i]).on('change', rec =>{
          console.log('OnChange: ', environment.collections[i], rec);
        });
    }

    nSQL(DOC_CHANGES_STREM)
        .model([ //lets hold all unsaved docs here
          { key: 'id', type: 'string', props: ['pk'] },
          { key: '*', type: '*' }
        ])
        .config({
          mode: 'PERM' // autodetect best method and persist data.
        })
        .connect().then(() =>{
          //now that we are fully connected, lets see if we have some
          //outstanding changes
          this.ServerSync();
          
        });

      this.getAllDocs('groups', true);
      this.getAllDocs('events', true);
      
  }



  //TODO: Here we might want to first check if we are connected
  //do this test on mobile devices, and apps
  async ServerSync(){
    //await this.SyncToServer();
    //await this.SyncFromServer();
  }

  async SyncToServer(){
    const changes = await nSQL(DOC_CHANGES_STREM).query('select').exec();
    console.log('Changes to update: ', changes);  

    for(let i=0;i<changes.length;i++){
      const col = (changes[i].action === 'saved')?changes[i].collection:changes[i].collection+'_deleted';
      await this._server_save(changes[i].doc, changes[i].collection);
    }
  }

  async SyncFromServer(){

  }

  subscribeChanges(collection:string): Observable<any> {
    return fromEvent(nSQL(collection), 'change').pipe(
      /*filter(event => {
        console.log('Subscribe to changes...', event);
        return event[0]['affectedRows'].length > 0;
      }),*/
      map(event => {
        console.log('subscribe ', event);
        if(event[0]['affectedRows'])
        return event[0]['affectedRows'];
      })
    );
  }

  async getDocById(id: string, collection: string): Promise<any> {

    const doc = await nSQL(collection).query('select')
      .where(['id','=',id]).exec();

    console.log('GetDoc: ', id, collection, doc);
    return doc[0];

  }

  async getAllDocs(collection, serverRefreshForce = false){
    const docs = await nSQL(collection).query('select').exec();

    if(serverRefreshForce){
      this._serverLoadCollection(collection);
    }

    return docs;
  }

  async getByQuery(field, operator, value, collection){
    const doc = await nSQL(collection).query('select')
      .where([field, operator, value ]).exec();

    console.log('GetDoc: ', field, operator,value, collection, doc);
    return doc;
  }


  async save(doc, collection) {
    console.log('Doc Save', doc);

    if(!doc.id){
      console.log('New doc, giving new id: ', doc);
      const username =  await this.authService.getUsername();
      console.log('Username: ', username);
      ObjectID.setMachineID(username);
      doc.id = await ObjectID.generate(Date.now() / 10);
      doc.meta_newid = true;
      doc._id = doc.id;
    }
    else {
      //get old doc
      const old = await this.getDocById(doc.id, collection);

      //lets see if there are actual changes
      const changes = diff(doc, old);

      console.log('ARE THERE CHANGES: ', changes);
      if(isEqual(old, doc)){
        console.log('NO Changes');
        return doc;
      }
      else {
        console.log('YES Changes');
        //lets make it dirty
        doc.meta_dirty = true;
      }
  
    }
    const result = await nSQL(collection).query('upsert', doc).exec();

    //since this is a new change, put into change stream, 
    await nSQL(DOC_CHANGES_STREM)
      .query('upsert', { id: doc.id, 
                         collection: collection, 
                         isDelete: doc.meta_removed,
                         action: 'saved',
                         doc: doc,
                        }).exec();
    const localDoc = result[0]['affectedRows'][0];

    await this._server_save(localDoc, collection);

    console.log('Saved, localdoc: ', localDoc);
    return localDoc;
  }

  async delete(doc, collection) {
    console.log('Remove', doc, collection);
    doc.meta_removed = true;
    doc.meta_dirty = true;

    //save into deleted collection, and remove it from this one
    await nSQL(collection+'_deleted').query('upsert', doc).exec();
    //first same as deleted, so subscriptions know that its gone, then remove it
    await nSQL(collection).query('upsert', doc).exec();
    await nSQL(collection).query('delete').where(['id','=',doc.id]).exec();
    await nSQL(DOC_CHANGES_STREM)
      .query('upsert', { id: doc.id, collection: collection, action: 'deleted'})
      .exec();

    
    const msg = await this._server_save(doc, collection);
    //console.log('Deleting result', msg);
  }

  async _server_save(doc, collection){
    try{
      console.log('Preparing for save: ', collection);
      if(doc.meta_newid){
        console.log('Saving to Server');
        this.feathersService[collection].create(doc);
      }
      else {
        console.log('Updating to Server::: ', collection);
        this.feathersService[collection].update(doc.id, doc);
      }
    }
    catch(e){
      console.log('Server Save Error: ', e);
      this.events.next({
        type:'', 
        message:e.message, 
        collection: collection, 
        e:e,
        doc: doc
      });
    }
  }

  async _server_onLoadDataFromServer(doc, collection) {
    //console.log('Load data from Server', doc, collection);

    //for some reason nSQL will keep unsaved props
    //so we have to specify them here, otherwise will not overwrite
    doc.meta_newid = false;
    doc.id = doc._id;
    //now we have to see if its a deleted doc or not
    if(doc.meta_removed){
      const result = await nSQL(collection+'_deleted').query('upsert', doc).exec();
      //console.log('LOADED DELETED DOC: ', result[0]['affectedRows']);
    }
    else {
      const result = await nSQL(collection).query('upsert', doc).exec();
      //console.log('LOADED DOC: ', result[0]['affectedRows']);
    }

    //also need to remove this item from change feed
    await nSQL(DOC_CHANGES_STREM)
      .query('delete').where(['id','=',doc.id]).exec();
    
  }


  async _server_onRemove(doc, collection): Promise<any> {
    console.log('Feathers Remove: ', doc, collection);
    return doc;
  }

  async _serverLoadCollection(collection) {
      try {
        console.log('Server Load: ', collection);
        const docs = await this.feathersService[collection].find({
          query: {
            $limit: 10000,
          }
        });

        //successfully loaded all docs for collection
        //lets drop local copy, and load new data
        await this._dropCollection(collection);
        await this._dropCollection(collection+_COLLECTION_DELETED_SUFIX);
        console.log('Loading all docs::::', docs);
        
        await docs.data.forEach( async d => {
          //save to local db
          //console.log('_serverLoadCollection Adding doc: ', collection, d);
          this._server_onLoadDataFromServer(d, collection);

        });

        console.log('Added '+docs.data.length+' docs to::::: '+ collection);
      } catch (e) {
        console.log('Error pulling all events', e);
      }
  }

  async _dropCollection(collection = 'all'){
    if(collection === 'all'){
      environment.collections.forEach( async col =>{
        await nSQL(col).query('drop').exec();
      });
    }
    else {
      //await nSQL(collection).query('drop').exec();
      await nSQL(collection)
        .query('delete').exec();
      //also drop any sync doc that reference this query
      console.log('Removing Docs from Change Stream for Group: ', collection);
      //await nSQL(DocService.DOC_CHANGES_STREM)
      //  .query('delete').where(['collection','=',collection]).exec();
    }
  }

}
