import { Injectable } from '@angular/core';
import * as feathers from 'feathers/client';
import * as io from 'socket.io-client';
import * as hooks from 'feathers-hooks';
import * as socketio from 'feathers-socketio/client';
import * as authentication from 'feathers-authentication-client';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FeathersService {

  private _feathers: any;
  private _socket: any;

  constructor() {


    this._socket = io(environment.api_url);       // init socket.io
    this._feathers = feathers();                      // init Feathers
    this._feathers.configure(hooks());                // add hooks plugin
    // this._feathers.configure(feathersRx({             // add feathers-reactive plugin
    //  idField: '_id'
    // }));
    this._feathers.configure(socketio(this._socket), { timeout: 5000 }); // add socket.io plugin
    this._feathers.configure(authentication({ storage: localStorage }));
  }

  public getService(name: string) {
    return this._feathers.service(name);
  }

  /*
  public getFeathers(){
    return this._feathers;
  }
  */

  // expose authentication
  public async authenticate(credentials?): Promise<any> {
    return await this._feathers.authenticate(credentials);
  }

  public async getUser(token: string) {
    const res = await this._feathers.passport.verifyJWT(token);
    console.log('feathers service get token, res: ', res);
    const user = await this._feathers.service('users').get(res.userId);
    console.log('feathers service get token, res2: ', user);
    return user;
  }

  // expose logout
  public logout() {
    return this._feathers.logout();
  }
}
