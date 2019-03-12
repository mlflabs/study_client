import { Component } from '@angular/core';

import { Platform, NavController } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { Router } from '@angular/router';
import { AuthService } from './auth/auth.service';
import { StateService } from './services/state.service';
import { saveIntoArray } from './utils';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent {

  public appPages = [];


  public _top = [
    {
      title: 'Home',
      url: '/projects',
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
      title: 'Graph',
      url: '/graph',
      icon: 'git-network',
      auth : true
    },
    {
      title: 'Groups',
      url: '/groups',
      icon: 'logo-buffer',
      auth : true
    },
    {
      title: 'Images',
      url: '/images',
      icon: 'images',
      auth : true
    }
  ];

  public groups = [];

  public showRightMenu= false;

  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    public navCtr: NavController,
    public router: Router,
    public auth: AuthService,
    public state: StateService,
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {

      this.statusBar.styleDefault();
      this.splashScreen.hide();

      this.appPages.pop();

      this.auth.isAuthenticated$.subscribe(state => {
        this.refresh();

        if (state) {
          //this.appPages = this._appPages.filter(p => p.auth === true);
          this.router.navigate(['projects']);
        } else {
          // add login page
          //this.appPages = this._appPages.filter(p => p.auth === false);
          this.router.navigate(['login']);
        }
      });

      this.state.selectedProject$.subscribe(project => {
        console.log('AppComponent Project Subscription:: ', project);
        this.refresh();
      });

      this.state.groups$.subscribe(groups =>{
        this.groups = groups;
      });



    });
    this.refresh();
  }

  refresh(){
    //first check if we are loged in;
    if(this.auth.isAuthenticated){
      this.appPages = this.generateMenu();
    }
    else {
      
    }
    console.log('App Pages:: ', this.appPages);
    //this.appPages = this._top;
  }

  generateMenu(){
    const menu = [];

    menu.push({
      title: 'Home',
      url: '/projects',
      icon: 'home',
      auth : true
    });
    console.log('Menu Checking projectid: ', this.state.projectId);
    if(this.state.projectId){
      menu.push({
        title: 'Project: ' + this.state.selectedProject.name,
        url: '/projects/p/'+this.state.projectId,
        icon: 'square',
        auth : true
      });
      menu.push({
        title: 'Timeline',
        url: '/projects/p/'+this.state.projectId+'/timeline',
        icon: 'analytics',
        auth : true
      });
      menu.push({
        title: 'Graph',
        url: '/projects/p/'+this.state.projectId+'/graph',
        icon: 'git-network',
        auth : true
      });
      menu.push({
        title: 'Groups',
        url: '/projects/p/'+this.state.projectId+'/groups',
        icon: 'logo-buffer',
        auth : true
      });
      menu.push({
        title: 'Images',
        url: '/projects/p/'+this.state.projectId+'/images',
        icon: 'images',
        auth : true
      });
     
    }
    console.log('Menu:: ', menu);
    return menu;
  }

  printUsername(){
    if(this.auth.user){
      return this.auth.user.username.charAt(0).toUpperCase() +
        this.auth.user.username.slice(1);
    }
    return 'Guest';
  }

  printAvatarUrl(){
    return 'assets/avatars/default.png';
  }

  goToEditProgile(){

  }

  logout(){
    this.auth.logout();
  }

  login(){
    this.navCtr.navigateForward('/login');
  }

  register(){
    this.navCtr.navigateForward('/register');
  }

  onGroupChange(group){
    console.log('OnGroupChange:: ', group);
    this.state.groups = saveIntoArray(Object.assign(
                  group, 
                  { visible: (group.visible === false || group.visible === null) },
                  { showNested: true }),
                  this.state.groups);
  }
}
