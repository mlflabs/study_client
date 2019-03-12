import { Injectable } from '@angular/core';
import { ProjectItem, GROUP_SERVICE } from '../models';
import { BehaviorSubject } from 'rxjs';
import { DataService } from './data.service';
import { NavController } from '../../../node_modules/@ionic/angular';
import { Router, NavigationEnd } from '../../../node_modules/@angular/router';
import { filter } from 'rxjs/operators';
import { saveIntoArray } from '../utils';


@Injectable({
  providedIn: 'root'
})
export class StateService {

  //currentURl
  private _url = '';
  url$: BehaviorSubject<string> = new BehaviorSubject(this.url);
  prevUrl = '';

  //projectp
  private _selectedProject = null;
  public selectedProject$:BehaviorSubject<any> =  new BehaviorSubject(this._selectedProject);

  //groups
  private _groups = [];
  
  public groups$: BehaviorSubject<any> = new BehaviorSubject(this.groups);
  private groupSubscription;
  //right menu
  private _showRightMenu = false;
  public showRightMenu$: BehaviorSubject<boolean> = new BehaviorSubject(this.showRightMenu);
  

  constructor(public dataService: DataService,
              public router: Router,
              public navCtr: NavController) { 
    router.events.pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        console.log('@@ ROUTER');
        console.log(e);

        this.url = e.urlAfterRedirects; 

        this.prevUrl = this.url.substring(0, this.url.lastIndexOf('/'));
        console.log(this.url, this.prevUrl);

        if(e.urlAfterRedirects.startsWith('/projects/list')){


          console.log('We are in Projects');
          this.selectedProject = null;
        
        } else if(e.urlAfterRedirects.endsWith('/timeline')){
          
        }

        //run these every time
        if(!e.urlAfterRedirects.endsWith('/timeline')){
          this.showRightMenu = false;
        }
    });
    
    
    
    this.dataService.subscribeProjectsChanges()
      .subscribe(project => {
        //see if our current project changes
        if(project._id === this.selectedProject._id){
          console.log('Current project changed:');

          //see if project has been removed
          if(project._deleted){
            this.selectedProject = null;
          }
          else {
            this.selectedProject = project;
          }
        }
      });

      

  }

  public get selectedProject() {
    return this._selectedProject;
  }
  public set  selectedProject(value) {
    console.log('Set Project::: ', value);
    //project change, need to make our 
    console.log('Old projectid: ', this.projectId);
    if(this.groupSubscription) this.groupSubscription.unsubscribe();

    this._selectedProject = value;
    this.selectedProject$.next(value);
    this.refreshGroups();
    console.log('New ProjectID: ', this.projectId);


    if(this.projectId)
      this.groupSubscription = this.dataService.subscribeProjectCollectionChanges(this.projectId, GROUP_SERVICE)
        .subscribe(group => {
          console.log('Subscribe group changes::: ', group);
          if(group._deleted){
            this.groups = this.groups.filter(g => g._id !== group._id);
          }
          else {
            this.groups = saveIntoArray(group, this.groups);
          }
          
      });

  }

  async refreshGroups(){
    console.log('Refresh Groups::::');
    // project changed, so we need to modify groups
    if(this.selectedProject){
      const g = await this.dataService.getAllByProjectAndType(this.projectId, GROUP_SERVICE);
      this.groups = g.sort((a,b) => {
        if(a['content'] < b['content']){
          return -1;
        }
        else if( a['content'] > b['content']){
            return 1;
        }
        else{
            return 0;
        }
      });
    }
    else{
      this.groups = []; 
    }
  }

  public get projectId(){
    if(this.selectedProject)
      return this._selectedProject.childId;
    return null;
  }



  public get showRightMenu() {
    return this._showRightMenu;
  }
  public set showRightMenu(value) {
    this._showRightMenu = value;
    this.showRightMenu$.next(value);
  }
  public get url() {
    return this._url;
  }
  public set url(value) {
    this._url = value;
    this.url$.next(value);
  }

  public get groups() {
    return this._groups;
  }
  public set groups(value) {
    this._groups = value;
    this.groups$.next(this.groups);
  }
}
