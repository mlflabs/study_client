import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { EventItem } from '../models/doc.model';
import { FeathersService } from './feathers.service';
import { DocServiceAbstract } from './_docs.service';

const ObjectID = require('bson-objectid');

@Injectable({
  providedIn: 'root'
})
export class EventsService extends DocServiceAbstract {

  private feathersService: any;


  constructor( private _feathers: FeathersService ) {
    super();
    this.feathersService = _feathers.getService(environment.service_events);

    this.feathersService.on('created', doc => this._save(doc));
    this.feathersService.on('updated', doc => this._save(doc));
    this.feathersService.on('removed', doc => this._remove(doc));
  }

  async remove(doc) {
    console.log('Doc getting ready for remove', doc);
    doc._removed = true;
    doc._dirty = true;
    doc = this._save(doc);
    this._filterDeleted();
    const msg = await this.feathersService.update(doc._id, doc);
    console.log('Deleting result', msg);
  }

  save(doc) {
    doc._dirty = true;

    // if new doc, then lets give it a temp id
    if (!doc._id) {
      doc._id = ObjectID.generate(Date.now() / 10);
      doc._newid = true;
    }
    doc = this._save(doc);
    console.log('saved doc, not sedning to server', doc);

    if (doc._newid) {
      // we don't need newid field, this is only for client use
      const newobj = Object.assign({}, doc);
      newobj.id = newobj._id;
      delete newobj._newid;
      const msg = this.feathersService.create(newobj);
    } else {
      doc.id = doc._id;
      const msg = this.feathersService.update(doc._id, doc);
    }

    return doc;
  }

  async loadAllDocs(force = false) {
    if (force || this.getAllDocs.length === 0) {
      try {
        const docs = await this.feathersService.find({
          query: {
            $limit: 5000,
          }
        });

        console.log('Loading all docs::::', docs);
        this._loadAllDocs(docs.data);
      } catch (e) {
        console.log('Error pulling all events', e);
      }
    }
  }





}
