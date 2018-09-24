import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject, from, of, range } from 'rxjs';
import { map, filter, switchMap } from 'rxjs/operators';
import * as io from 'socket.io-client';
import feathers from 'feathers-client';
import { DocService } from './docs.service';
import { Doc } from '../models/doc.model';

export abstract class ApiService {

  private _url: string;
  private _serviceName: string;
  private feathersService: any;

  private docService: DocService;


  constructor(url: string,
    serviceName: string,
    docService: DocService) {

    this._url = url;
    this._serviceName = serviceName;

    const socket = io(this._url);
    const client = feathers().configure(feathers.socketio(socket));
    this.feathersService = client.service('event');

    this.feathersService.on('created', doc => this.docService._save(doc));
    this.feathersService.on('updated', doc => this.docService._save(doc));
    this.feathersService.on('removed', doc => this.docService._remove(doc));
  }

  /*
  public find() {
    this.feathersService.find((err, events: EventItem[]) => {
      if (err) { return console.error(err); }

      this.dataStore.events = events;
      this.eventsObserver.next(this.dataStore.events);
    });
  }
  */

  /*
  private getIndex(id: string): number {
    let foundIndex = -1;

    for (let i = 0; i < this.dataStore.events.length; i++) {
      if (this.dataStore.events[i].id === id) {
        foundIndex = i;
      }
    }

    return foundIndex;
  }*/

}

