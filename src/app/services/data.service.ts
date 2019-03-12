import { Platform } from '@ionic/angular';
import { Injectable } from '@angular/core';
import PouchDB from 'pouchdb';
import PouchDBFind from 'pouchdb-find';
import { Observable, fromEvent, Subject } from 'rxjs';
import { map, debounceTime, filter, first } from 'rxjs/operators';
import { Doc, PROJECT_SERVICE, PROJECT_INDEX_SERVICE, ProjectItem } from '../models';
import { generateCollectionId, generateShortCollectionId, generateShortUUID, waitMS } from '../utils';
import { promise } from '../../../node_modules/protractor';
import { isEqual } from 'lodash';
import { diff } from 'deep-diff';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../environments/environment';
import { ProjectsPage } from '../pages/projects/projects.page';

export const TYPE_TASKS = 'todotasks';
export const TYPE_CATEGORIES = 'todocategories';

PouchDB.plugin(PouchDBFind);
// PouchDB.debug.enable('pouchdb:find');

@Injectable({
  providedIn: 'root'
})
export class DataService {

  
  private _pouch: any;
  private _pouchReady;
  public ready = false;
  private _changes;
  private _user;

  private _localPouchOptions = {
    revs_limit: 5,
    auto_compaction: true
  };

  constructor(private platform: Platform,
              public authService: AuthService) {
    this._changes = new Subject();
    this._pouchReady = new Subject();

    this.platform.ready().then(() => {
      this._user = authService.user;
      this.initPouch(environment.pouch_prefix + this._user.username,
        this._user.username !== 'Guest',
        false );

      authService.user$.subscribe(user =>{
        if(user.username !== this._user.username){
          // only update if we are different, user change
          // also see if we are updating from guest, import old data
          if(this._user.username === 'Guest'){
            this.initPouch(environment.pouch_prefix+user.username, true, true);
          }
          else {
            this.initPouch(environment.pouch_prefix+user.username, true, false);
          }
          this._user = user;
        }
      });
    });
  }


  waitForReady(): Observable<any> {
    // let others know are datasource is ready
    return this._pouchReady.asObservable().pipe(first());
    if(this.ready === true){
      this._pouchReady.next(true);
    }

  }

  subscribeChanges(): Observable<any> {
    return this._changes.asObservable().pipe(
      // debounceTime(1000),
      map(doc => {
        return doc;
      })
    );
  }

  subscribeCollectionChanges(type: string, debounce:number=0): Observable<any> {
    return this._changes.asObservable().pipe(
      debounceTime(debounce),
      filter(doc => doc['_id'].startsWith(type+'|'))
    );
  }

  subscribeProjectCollectionChanges(project: string, 
                                    type: string, 
                                    debounce:number=0): Observable<any> {
    return this._changes.asObservable().pipe(
      debounceTime(debounce),
      filter(doc => doc['_id'].startsWith(project+'|'+type+'|'))
    );
  }

  subscribeProjectsChanges(debounce:number=0): Observable<any>{
    return this._changes.asObservable().pipe(
      debounceTime(debounce),
      filter(doc => doc['_id'].startsWith(PROJECT_SERVICE+'|'+PROJECT_INDEX_SERVICE+'|'))
    );
  }



  subscribeDocChanges(id: string, debounce: number = 0): Observable<any> {
    return this._changes.asObservable().pipe(
      debounceTime(debounce),
      filter(doc => doc['_id'] === id)
    );
  }

  async getByQuery(query){
    try{
      const res = await this._pouch.find(query);
      return res.docs;
    }
    catch(e){
      console.log('GetByQuery', query, e);
      return [];
    }
    
  }

  async getAllByType(type, serverRefreshForce = false, attachments=false){
    const res = await this._pouch.allDocs({
      include_docs: true,
      attachments: attachments,
      startkey: type+'|',
      endkey: type+'|'+ String.fromCharCode(65535)
    });
    const docs = res.rows.map(row => row.doc);
    return docs;
  }

  async getAllByProjectAndType(project, type, attachments=false){
    //const all = await this._pouch.allDocs();
    const res = await this._pouch.allDocs({
      include_docs: true,
      attachments: attachments,
      startkey: project+'|'+type+'|',
      endkey: project+'|'+type+'|'+ String.fromCharCode(65535)
    });
    const docs = res.rows.map(row => row.doc);
    return docs;
  }

  async getAllDocs() {
    const res = await this._pouch.allDocs({include_docs: true});
    const docs = res.rows.map(row => row.doc);
    return docs;
  }

  async remove(id, syncRemote = true) {
    try {
      const doc = await this._pouch.get(id);
      doc._deleted = true;
      doc.updated = Date.now();
      const res = await this._pouch.put(doc);

      if(syncRemote) this.syncRemote();

      if(res.ok)
        return res;
      else
        return false;
    }
    catch(e) {
      console.log('Remove Pouch Error:: ', e);
      return false;
    }
  }

  async removeProject(project: ProjectItem, syncRemote=true){
    try{
      //load all project children and remove them
      const res = await this._pouch.allDocs({
        include_docs: true,
        startkey: project.childId + '|',
        endkey: project.childId + '|' + String.fromCharCode(65535)
      });
      const docs = res.rows.map(row => Object.assign(
        row.doc, {_deleted: true, updated: Date.now()} ));
      
      docs.push(Object.assign(project, {_deleted: true, updated: Date.now()}));
      const res2 = await this._pouch.bulkDocs(docs);

      if(syncRemote) this.syncRemote();

      return res2;
    }
    catch(e){
      console.log('Remove Project Error: ', e);
    }
  }

  

  async saveNewProject(doc, syncRemote = true): Promise<any> {
    const uuid = generateShortUUID();
    doc._id = PROJECT_SERVICE + '|' + PROJECT_INDEX_SERVICE + '|' + uuid;
    doc.childId = PROJECT_SERVICE+ '|' + uuid;
    doc.user = this.authService.user.username;
    doc.meta_access = [ 'u|'+ this.authService.getUsername() + '|' + uuid, ]; 

    try {
      const res = await this._pouch.put(doc);

      if(syncRemote) this.syncRemote();

      return res;
    }
    catch(e){
      console.log('Error saving new project: ', e);
      return false;
    }

  }

  async saveInProject(doc, 
                      project: ProjectItem = {},
                      collection:string='', 
                      oldDoc = null, 
                      attachment = null,
                      syncRemote = true): Promise<any> {

    // if its a design doc, or query, skip it
    if(doc._id != null && doc._id.startsWith('_') )
    {
      return false;
    }

    console.log('Saving Doc: ', doc, project, collection, oldDoc);

    // see if we need to compare changes and only save if there are any
    // lets see if there are actual changes
    // Here we can also load an old doc, see if it exists
    if(!oldDoc && doc._id){
      try{
        //see if we have old doc.
        oldDoc = await this._pouch.get(doc._id);
      }
      catch(e){

      }
    }

    if(oldDoc != null){
      if(isEqual(oldDoc, doc)){
        return false; // we have no need to save, maybe here we need something else, like a message
      }
    } 

    //make sure access is same as project
    doc.meta_access = project.meta_access;

    let res;
    try {
      doc.updated = Date.now();

      if(doc._id == null){
        doc._id = project.childId +'|' +generateShortCollectionId(collection);
        doc.id = doc._id; // for vis components, they only use id not _id
        res = await this._pouch.put(doc);
      }
      else{
        //make sure we have an id
        if(!doc.id) doc.id = doc._id;
        res = await this._pouch.put({...oldDoc, ...doc});
      }

      //see if we have an attachment
      if(attachment){
        //TODO:: use attachment.size to restrict big files
        res = await this._pouch.putAttachment(doc._id, 'file', res.rev, attachment, attachment.type);
      }

      if(syncRemote) this.syncRemote();

      console.log('Saved doc: ', res);
      if(res.ok)
        return res;
      else
        return false;
    }
    catch(e) {
      console.log('Save Pouch Error: ', e);
      return false;
    }
  }

  async save(doc, collection:string='', oldDoc = null, attachment = null, syncRemote=true): Promise<any> {

    // if its a design doc, or query, skip it
    if(doc._id != null && doc._id.startsWith('_') )
    {
      return false;
    }
    // see if we need to compare changes and only save if there are any
    // lets see if there are actual changes
    const changes = diff(doc, oldDoc);
    if(oldDoc != null){
      if(isEqual(oldDoc, doc)){
        return false; // we have no need to save, maybe here we need something else, like a message
      }
    }

    let res;
    try {
      doc.updated = Date.now();

      if(doc._id == null){
        doc._id = generateCollectionId(collection);
        doc.id = doc._id; // for vis components, they only use id not _id
        console.log(doc);
        res = await this._pouch.put(doc);
      }
      else{
        // try getting the doc and merge it
        const old = await this._pouch.get(doc._id);
        console.log('Got old doc: ', old);

        //make sure we have an id
        if(!doc.id)
          doc.id = doc._id;

        res = await this._pouch.put({...old, ...doc});
      }

      //see if we have an attachment
      if(attachment){
        //TODO:: use attachment.size to restrict big files
        res = await this._pouch.putAttachment(doc._id, 'file', res.rev, attachment, attachment.type);
      }

      if(syncRemote) this.syncRemote();
      
      console.log('Saved doc: ', res);
      if(res.ok)
        return res;
      else
        return false;
    }
    catch(e) {
      console.log('Save Pouch Error: ', e);
      return false;
    }
  }

  async getImage(id, name){
    const img = this._pouch.getAttachment(id, name);
    return img;
  }

  async getDoc(id:string, attachments = false, opts = {}): Promise<any> {
    try {
      const doc = await this._pouch.get(id, { ...{attachments: attachments}, ...opts });
      console.log('Get Doc Loaded: ', doc);
      return doc;
    }
    catch(e){
      console.log('Get Doc Error: ', e);
      return null;
    }
  }

  async findDocsByCategory(id:string): Promise<any> {
    try {
      const docs = await this._pouch.find({
        selector: {
          category: {$eq: id}
        }
      });
      return docs.docs;
    }
    catch(e){
      console.log('Error finding docs: ', e);
      return [];
    }
  }

  async findDocsByProperty(value, prop:string): Promise<any> {
    try {

      const query = { [prop]: {$eq: value}};
      console.log('Query: ', query);


      const docs = await this._pouch.find({
        selector: {
          [prop]: {$eq: value}
        }
      });

      return docs.docs;
    }
    catch(e){
      console.log('Error finding docs by property: ', e, value, prop);
      return [];
    }
  }

  async findAllDocsByPropertyNotNull(prop:string): Promise<any> {
    try {
      const docs = await this._pouch.find({
        selector: {
          [prop]: {'$gt': 0}
        }
      });
      console.log('Found docs not null by property::: ', prop, docs);

      return docs.docs;
    }
    catch(e){
      console.log('Error finding not null docs by property: ', e,  prop);
      return [];
    }
  }

  private async  initPouch(pouchName:string,
                    syncRemote:boolean=false,
                    mergeOldData:boolean=false):Promise<any> {

    console.log('DataProvider->initDB localName: ' + pouchName);

    let olddocs;

    if(mergeOldData){
      // if we are merging, first get all the data
      olddocs = await this.getAllDocs();
    }
    this._pouch = await new PouchDB(pouchName, this._localPouchOptions);

    window['PouchDB'] = PouchDB;// make it visible for chrome extension

      // create our event subject
    this._pouch.changes({live: true, since: 'now', include_docs:true})
        .on('change', change => {
          console.log('Pouch on change', change);
          this._changes.next(change.doc);
    });

    if(syncRemote){
      this.syncRemote();
    }

    // load the docs into new pouch db
    if(mergeOldData){
      olddocs.forEach(doc => {
        this.save(doc);
      });
    }
    this.ready = true;
    this._pouchReady.next(true);
    this.createSettingsDoc();
  }



  async createSettingsDoc(){
    await waitMS(500);
    console.log('%%%%%%% Create Settings Doc: ');
    try{
      const settings = await this.getDoc('settings');
      console.log('Settings:: ', settings);
    }
    catch(e){
      console.log('Error creating settings Doc: ', e);
      if(e.reason === 'missing'){
        this._pouch.put({_id: 'settings', app: 'study_notes'});
      }
    }
  }

  syncRemote(){
    console.log('USER::: ', this._user);
      const remoteDB = new PouchDB(environment.couch_db,
        {headers:{ 'x-access-token': this._user.token} });

      const opts = {
        live: false,
        retry: false
      };
      this._pouch.replicate.to(remoteDB, opts);
      this._pouch.replicate.from(remoteDB, opts)
       .on('change', function (change) {
        console.log('Remote Sync: ', change);
      }).on('error', function (err) {
        console.log('Remote Error: ', err);
        // yo, we got an error! (maybe the user went offline?)
      }).on('complete', function () {
        console.log('Remote Sync Completed ');
      }).on('paused', function (info) {
        console.log('Remote Sync PAUSED: ', info);
        // replication was paused, usually because of a lost connection
      }).on('active', function (info) {
        console.log('Remote Sync ACTIVE: ', info);
      });
  }

}
