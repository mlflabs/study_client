import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { BehaviorSubject } from 'rxjs';
import { Storage } from '@ionic/storage';
import { FeathersService } from './feathers.service';
import { create } from 'domain';

const TOKEN_KEY = 'auth-token';
const USER_KEY = 'auth-user';

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
      this.loginJWT();
    });

    this.isAuthenticated.next(false);
  }

  async getUsername(){
    const u = await this.storage.get(USER_KEY);
    console.log('Auth Getting username: ', u);
    return u.name;
  }


  async loginJWT(token: string = null) {
    try {
      if (token === null) {
        token = await this.storage.get(TOKEN_KEY);
      }

      const res = await this.feathers.authenticate({
        strategy: 'jwt',
        accessToken: token
      });

      const user = await this.saveCredentials(res.accessToken);

      console.log('Successful JWT login: ', user);
    } catch (err) {
      console.log(err);
    }
  }



  async login(email: string, password: string, strategy: string = 'local') {
    try {
      const token = await this.feathers.authenticate({
        email: email,
        password: password,
        strategy: strategy
      });
      const user = await this.saveCredentials(token.accessToken, true);

      return createAuthEvent(true, 200, user);
    } catch (err) {
      console.log(err);
      return createAuthEvent(false, err.code, err);
      // TODO, need to figure out what error codes we will receive
    }

  }

  async saveCredentials(token: string, forceRefresh = false) {
    let user = await this.storage.get(USER_KEY);
    if (forceRefresh || !user) {
      user = await this.feathers.getUser(token);
      await this.storage.set(USER_KEY, user);
    }
    await this.storage.set(TOKEN_KEY, token);

    this.isAuthenticated.next(true);
    this.user.next(user);
    return user;
  }

  async logout() {
    this.feathers.logout();
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




}
