import { Injectable } from '@angular/core';
import { Doc } from '../models/doc.model';
import { Observable, Subject, BehaviorSubject, from, of, range } from 'rxjs';
import { map, filter, switchMap } from 'rxjs/operators';
import { saveIntoArray, generateShortUUID } from '../utils';


// const  uniqid = require('uniqid');

export abstract class DocService {

  private dataStore: {
    docs: Doc[],
    selected: Doc
  };

  private _docs: BehaviorSubject<Doc[]>;

  constructor() {
    this.dataStore = { docs: [], selected: new Doc() };
    this._docs = new BehaviorSubject(this.dataStore.docs);
  }

  getDoc(id: string): Doc {
    const d = this.dataStore.docs.find((doc) => {
      if (doc._id === id) {
        return true;
      }
      return false;
    });
    if (!d) {
      return null;
    }
    return d;
  }

  getAllDocs() {
    return this.dataStore.docs;
  }

  getDocObservable(id: string): Observable<any> {
    return this._docs.asObservable().pipe(
      map(doc => {
        return doc.find(d => d._id === id);
      })
    );
  }

  getDocsObservable(): Observable<any> {
    return this._docs.asObservable();
  }

  _filterDeleted() {
    this.dataStore.docs = this.dataStore.docs.filter(d => d._removed !== true);
    this._docs.next(this.dataStore.docs);
  }

  _remove(doc: Doc): Doc {
    this.dataStore.docs = saveIntoArray(doc, this.dataStore.docs);
    this.dataStore.docs = this.dataStore.docs.filter(d => d._removed !== true);
    this._docs.next(this.dataStore.docs);
    return doc;
  }

  _save(doc: Doc): Doc {
    console.log('Doc Save Before', doc, this.dataStore.docs);
    if (!doc._removed) {
      this.dataStore.docs = saveIntoArray(doc, this.dataStore.docs);
    }
    this._docs.next(this.dataStore.docs);
    console.log('Doc Save After', this.dataStore.docs);
    return doc;
  }

  _loadAllDocs(docs: Doc[]) {
    this.dataStore.docs = docs.filter(d => d._removed !== true);
    this._docs.next(this.dataStore.docs);
  }





}
