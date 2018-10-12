import { Injectable } from '@angular/core';
import { Platform, Tab } from '@ionic/angular';
import { BehaviorSubject, throwError } from 'rxjs';
import { Storage } from '@ionic/storage';
import { FeathersService, AuthEvent, createAuthEvent } from './feathers.service';
import * as moment from 'moment';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { catchError, retry, tap, map } from '../../../node_modules/rxjs/operators';

const TOKEN_KEY = 'auth-token';
const TOKEN_EXP = 'auth-token-exp';
const USER_KEY = 'auth-user';

export interface UserModel {
  name?: string;
  email?: string;
}

export function guestUser() {
  return { name: 'Guest', email: null};
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {


  isAuthenticated = new BehaviorSubject(false);
  user = new BehaviorSubject(guestUser());

  constructor(private feathers: FeathersService,
    private storage: Storage,
    private plt: Platform) {
    this.plt.ready().then(() => {
      if(this.checkLogin())
        this.loginJWT();//renew token only if we have saved credentials
    });

    this.isAuthenticated.next(false);
  }

  async getUsername(){
    const u = await this.storage.get(USER_KEY);
    console.log('Auth Getting username: ', u);
    return u.name;
  }

  async checkLogin(){
    try{
      const user = await this.storage.get(USER_KEY);
      if(!user){
        this.logout();
        return;
      }

      const token = await this.storage.get(TOKEN_KEY);
      if(!token){
        this.logout();
        return;
      }

      console.log('LOADED UER', user);

      const exp = moment(user.createdAt).add(environment.token_expiery, 'days');
      if(exp.isAfter(moment.now())){
        //token still active
        this.isAuthenticated.next(true);
        this.user.next(user);
        return user;
      }
      return false;
    }
    catch(e){
      console.log(e);
      return false;
    }
  }

  async loginJWT(token: string = null) {
    try {
      if (token === null) {
        token = await this.storage.get(TOKEN_KEY);
        if(!token){
          //we have no token, lets just logout and request a login
          await this.logout();
          return;
        }
      }

      console.log('Got Token, lets see if its expired');

      const authEvent:AuthEvent = await this.feathers.renewJWT(token);

      if(authEvent.success){
        const user = await this.saveCredentials(authEvent.data);
      }
      else{
        console.log('Failed to renew token:: ', authEvent);
        //await this.logout();
      }

      ///const user = await this.saveCredentials(res.accessToken);

      //console.log('Successful JWT login: ', user);
    } catch (err) {
      console.log(err);
    }
  }



  async login(email: string, password: string, strategy: string = 'local'): Promise<AuthEvent> {
      const tokenEvent:AuthEvent = await this.feathers.login(email, password, 'local');

      if(tokenEvent.success){
        const user = await this.saveCredentials(tokenEvent.data, true);
        console.log('user::: ', user);
        return createAuthEvent(true, 1, user);
      }
      else {
        console.log('Error auth::: ', tokenEvent);
        return tokenEvent;
      }
  }

  async saveCredentials(token: string, forceRefresh = false) {
    let user = await this.storage.get(USER_KEY);
    if (forceRefresh || !user) {
      user = await this.feathers.getUser(token);
      if(user){
        console.log('Saving User: ', user);
        await this.storage.set(USER_KEY, user);
      }
      else {
        return false;
      }
      
    }
    await this.storage.set(TOKEN_KEY, token);

    this.isAuthenticated.next(true);
    this.user.next(user);
    return user;
  }

  async logout() {
    //this.feathers.logout();
    await this.storage.remove(TOKEN_KEY);
    await this.storage.remove(USER_KEY);
    this.isAuthenticated.next(false);
    this.user.next(guestUser());
  }



  register(credentials): Promise<AuthEvent> {
    return new Promise(resolve => {
      console.log('Auth Service Register Credentials: ', credentials);
      this.feathers.getService('users')
        .create(credentials)
        .then(data => {
          console.log('User registered: ', data);
          resolve(createAuthEvent(true, 200, data));
        })
        .catch(err => {
          console.log('Error creating user:  ', err);
          resolve(createAuthEvent(false, 409, err));
        });
    });
  }






  checkToken_old() {
    this.storage.get(TOKEN_KEY).then(res => {
      if (res) {
        this.isAuthenticated.next(true);
      }
    });
  }

  isAuthenticated_old() {
    return this.isAuthenticated.value;
  }

  logout_old() {
    return this.storage.remove(TOKEN_KEY).then(() => {
      this.isAuthenticated.next(false);
    });
  }

  login_old() {
    return this.storage.set(TOKEN_KEY, 'Bearer 1234567').then(() => {
      this.isAuthenticated.next(true);
    });
  }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`);
    }
    // return an observable with a user-facing error message
    return throwError(
      'Something bad happened; please try again later.');
  };


}
