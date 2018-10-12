import { Injectable } from '@angular/core';
import * as feathers from '@feathersjs/client';
//import * as io from 'socket.io-client';
import * as hooks from 'feathers-hooks';
//import * as socketio from 'feathers-socketio/client';
import * as  rest from '@feathersjs/rest-client';
import * as AuthClient from 'feathers-authentication-client';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import * as PrimusClient from '@feathersjs/primus-client';
import { httpFactory } from '../../../node_modules/@angular/http/src/http_module';
import * as superagent from 'superagent';
import * as Auth from '@feathersjs/authentication';

export interface AuthEvent {
  success: boolean;
  code: number;
  data: any;
} 

export function createAuthEvent(success: boolean = true,
  code = 1,
  data = {}): AuthEvent {
  return {
    success, code, data 
  };
}

@Injectable({
  providedIn: 'root'
})
export class FeathersService {

  private _feathers: any;
  private _socket: any;
  private _rest: any;
  private _token;

  constructor(public http: HttpClient) {

    this._rest = rest(environment.api_url);
    //this._socket = new PrimusClient(environment.api_url);       // init socket.io
    this._feathers = feathers();                      // init Feathers
    //this._feathers.configure(hooks());                // add hooks plugin
    // this._feathers.configure(feathersRx({             // add feathers-reactive plugin
    //  idField: '_id'
    // }));
    //this._feathers.configure(socketio(this._socket), { timeout: 15000 }); // add socket.io plugin
    
    //this._feathers.configure(this._rest.configure(http, {Headers}));
    this._feathers.configure(this._rest.angularHttpClient(http, 
      { HttpHeaders: HttpHeaders }));
    //this._feathers.configure();
    this._feathers.configure(feathers.authentication());
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
    try{
      const res = await this._feathers.passport.verifyJWT(token);
      console.log('feathers service get token, res: ', res);
      const user = await this._feathers.service('users').get(res.userId);
      console.log('feathers service get token, res2: ', user);
      return user;
    }
    catch(err){
      console.log('GetUser Error:: ', err);
      return false;
    }
  }




  async renewJWT(token){

    try{
      const res = await this._feathers.authenticate({
        strategy: 'jwt',
        accessToken: token
      });
      console.log('Feathers renewToken: ', res);
      return createAuthEvent(true,1,res.accessToken);
    }
    catch (err) {
      console.log(err);
      return createAuthEvent(false, err.code, err);
      // TODO, need to figure out what error codes we will receive
    }
    


  }


  async login(email: string, password: string, strategy: string = 'local'): Promise<AuthEvent> {
    
    try{
      const res = await this._feathers.authenticate({
        strategy: 'local',
        email: email,
        password: password
      });
        
      console.log('Feathers::Login res: ', res);
      return createAuthEvent(true, 1, res['accessToken']);
    
    } catch (err) {
      console.log(err);
      return createAuthEvent(false, err.code, err);
      // TODO, need to figure out what error codes we will receive
    }
    
    /*try {
      const res = await this.http.post(environment.api_url+'/authentication', 
      {
        strategy: 'local',
        email: email,
        password: password
      }, {}).toPromise();
      
      console.log('Feathers::Login res: ', res);
      return createAuthEvent(true, 1, res['accessToken']);
        
      } catch (err) {
        console.log(err);
        return createAuthEvent(false, err.error.code, err.error);
        // TODO, need to figure out what error codes we will receive
      }
      */
  }

  // expose logout
  public logout() {
    return this._feathers.logout();
  }
}
