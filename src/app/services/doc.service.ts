import { Injectable } from '@angular/core';
import { Observable, Subject, fromEvent } from 'rxjs';
import { map, debounceTime } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { nSQL } from 'nano-sql';
import { FeathersService } from './feathers.service';
const ObjectID = require('bson-objectid');
import { isEqual } from 'lodash';
import { diff } from 'deep-diff';
import { AuthService } from './auth.service';


export const DOC_LOCAL_CHANGES_STREM = 'change-feed';

export const _COLLECTION_DELETED_SUFIX = '_deleted';
export const EVENT_SERVICE = 'events';
export const GROUP_SERVICE = 'groups';
export const SETTINGS_SERVICE = 'settings';

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
          { key: 'id', type: 'timeIdms', props: ['pk'] },
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
    }

    nSQL(DOC_LOCAL_CHANGES_STREM)
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
          
        });

    nSQL(SETTINGS_SERVICE)
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
  }



  //TODO: Here we might want to first check if we are connected
  //do this test on mobile devices, and apps
  async ServerSync(){
    await this.SyncFromServer();
    await this.SyncToServers();
  }

  async SyncToServers(){
    const changes = await nSQL(DOC_LOCAL_CHANGES_STREM).query('select').exec();
    console.log('####### Changes to update: ', changes);  

    for(let i=0;i<changes.length;i++){
      await this._server_save(changes[i].doc, changes[i].collection);
    }
  }

  async SyncFromServer(){
    environment.sync_collections.forEach(async collection => {
      const changelog = await this.getDocById(collection+'_lastChange', 
                            SETTINGS_SERVICE);

      
      console.log('SyncFromServer: ', changelog);
      if(changelog) {
        await this._serverLoadCollection(collection, changelog.date);
      }
      else {
        await this._serverLoadCollection(collection);
      }

    });
  }


  subscribeChanges(collection:string): Observable<any> {
    return fromEvent(nSQL(collection), 'change').pipe(
      debounceTime(1000),
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

    console.log('GetAllDocs:::: ', collection, docs);
    if(serverRefreshForce){
      this._serverLoadCollection(collection);
    }
    return docs;
  }

  async getByQuery(field, operator, value, collection): Promise<any>{
    const doc = await nSQL(collection).query('select')
      .where([field, operator, value ]).exec();

    console.log('GetDoc: ', field, operator,value, collection, doc);
    return doc;
  }

  async searchByField(value, field, collection, limit=20): Promise<any>{
    const doc = await nSQL(collection).query('select')
      .where([field, 'LIKE', value ]).limit(limit).exec();

    console.log('Search Docs: ', collection, field, limit, value, doc);
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

      //console.log('ARE THERE CHANGES: ', changes);
      if(isEqual(old, doc)){
        //console.log('NO Changes');
        return doc;
      }
      else {
        //console.log('YES Changes');
        //lets make it dirty
        doc.meta_dirty = true;
      }
  
    }
    const result = await nSQL(collection).query('upsert', doc).exec();

    console.log('Save 1 Results: ', result);

    //since this is a new change, put into change stream, 
    if(environment.collections.includes(collection)){

      if(environment.sync_collections.includes(collection)){
        //only add to stream if its a sync collection
        await nSQL(DOC_LOCAL_CHANGES_STREM)
          .query('upsert', { id: doc.id, 
                            collection: collection, 
                            isDelete: doc.meta_removed,
                            action: 'saved',
                            doc: doc,
                            }).exec();
      }
      const localDoc = result[0]['affectedRows'][0];

      await this._server_save(localDoc, collection);

      console.log('Saved, localdoc: ', localDoc);
      return localDoc;
    }

    return result[0]['affectedRows'][0];
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
    await nSQL(DOC_LOCAL_CHANGES_STREM)
      .query('upsert', { id: doc.id, collection: collection, action: 'deleted'})
      .exec();

    
    const msg = await this._server_save(doc, collection);
    //console.log('Deleting result', msg);
  }

  async _server_save(doc, collection){
    try{

      //first filter private collections
      if(collection === SETTINGS_SERVICE)
        return false;

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
      console.log('LOADED DELETED DOC: ', collection+'_deleted', result[0]['affectedRows']);
    }
    else {
      const result = await nSQL(collection).query('upsert', doc).exec();
      //console.log('Server to Local Save: ', collection, result);
      console.log('LOADED DOC: ', collection, result[0]['affectedRows']);
    }

    //also need to remove this item from change feed
    await nSQL(DOC_LOCAL_CHANGES_STREM)
      .query('delete').where(['id','=',doc.id]).exec();
    
  }


  async _server_onRemove(doc, collection): Promise<any> {
    console.log('Feathers Remove: ', doc, collection);
    return doc;
  }

  async _serverLoadCollection(collection, lastUpdateDate=null) {
      try {
        console.log('Server Load: ', collection);
        let docs;
        if(lastUpdateDate){
          docs = await this.feathersService[collection].find({
            query: { 
              $limit: 10000,
              $sort: {
                _id: -1
              },
              updatedAt: {
                $gt: lastUpdateDate - 500 //take out 500 millseconds, give buffer for missed docs
              }
            } 
          });
        }
        else {
          docs = await this.feathersService[collection].find({
            query: { $limit: 10000 } 
          });

          await this._dropCollection(collection);
          await this._dropCollection(collection+_COLLECTION_DELETED_SUFIX);
        }

        if(docs.date)
          await this.save({id: collection+'_lastChange', 
                          date: docs.date},
                          SETTINGS_SERVICE);
        
        console.log('Loading all docs::::', docs);
        
        await docs.data.forEach( async d => {
          await this._server_onLoadDataFromServer(d, collection);
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

      //drop settings and change feed
      await nSQL(SETTINGS_SERVICE).query('drop').exec();
      await nSQL(DOC_LOCAL_CHANGES_STREM).query('drop').exec();
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
