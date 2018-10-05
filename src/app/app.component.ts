import { Component } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { EventsService } from './services/events.service';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent {

  public appPages = [];

  public _appPages = [
    {
      title: 'Home',
      url: '/home',
      icon: 'home',
      auth : true
    },
    {
      title: 'Timeline',
      url: '/list',
      icon: 'list',
      auth : true
    },
    {
      title: 'Groups',
      url: '/groups',
      icon: 'logo-buffer',
      auth : true
    },
    {
      title: 'User',
      url: '/private/user',
      icon: 'settings',
      auth : true
    },
    {
      title: 'Admin',
      url: '/admin/orm',
      icon: 'build',
      auth : true
    },
    {
      title: 'Login',
      url: '/auth/login',
      icon: 'contact',
      auth : false
    },
    {
      title: 'Register',
      url: '/auth/register',
      icon: 'settings',
      auth : false
    }
  ];

  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,

    public router: Router,
    public eventService: EventsService,
    public auth: AuthService,
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {

      this.statusBar.styleDefault();
      this.splashScreen.hide();

      this.appPages.pop();

      console.log(this.auth.isAuthenticated);
      this.auth.isAuthenticated.subscribe(state => {
        if (state) {
          this.appPages = this._appPages.filter(p => p.auth === true);
          this.router.navigate(['home']);
        } else {
          // add login page
          this.appPages = this._appPages.filter(p => p.auth === false);
          this.router.navigate(['auth/login']);
        }
      });

    });
  }
}
