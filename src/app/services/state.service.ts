import { Injectable } from '@angular/core';
import { ProjectItem, GROUP_SERVICE, EVENT_SERVICE, LASTCHAR, EventItem } from '../models';
import { BehaviorSubject, Subject } from 'rxjs';
import { DataService } from './data.service';
import { NavController } from '../../../node_modules/@ionic/angular';
import { Router, NavigationEnd } from '../../../node_modules/@angular/router';
import { filter, debounceTime } from 'rxjs/operators';
import { saveIntoArray } from '../utils';
import { projection } from '../../../node_modules/@angular/core/src/render3/instructions';


@Injectable({
  providedIn: 'root'
})
export class StateService {

  //graph
  //graph search props
  public eventItemAdd$ = new Subject();
  public edgeSelectionChanged$ = new Subject();
  public nodeSelectionChanged$ = new Subject();

  private _searchItems = [];
  private _edge = null;
  private _node = null;
  private _nodes: Array<EventItem> = [];
  
  public nodes$: BehaviorSubject<Array<EventItem>> = new BehaviorSubject(this._nodes);


  public showEditEdge = false;

  //currentURl
  private _url = '';
  url$: BehaviorSubject<string> = new BehaviorSubject(this.url);
  prevUrl = '';
  pageType$: BehaviorSubject<string> = new BehaviorSubject('');

  //projectp
  private _selectedProject = null;
  public selectedProject$:BehaviorSubject<any> =  new BehaviorSubject(this._selectedProject);

  //groups
  private _groups = [];
  
  public groups$: BehaviorSubject<any> = new BehaviorSubject(this.groups);
  //right menu
  private _showRightMenu = false;
  public showRightMenu$: BehaviorSubject<boolean> = new BehaviorSubject(this.showRightMenu);
  

  //subscriptions
  private groupSubscription;
  private eventSubscription;

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
          this.pageType$.next('projects');
        
        } else if(e.urlAfterRedirects.endsWith('/timeline')){
          this.pageType$.next('timeline');
          this.showRightMenu = true;
        }
        else {
          this.pageType$.next('other'); // for all other
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

    this.eventItemAdd$.subscribe(item =>{
        this.updateNode(item as EventItem);
    });


  }

  public get selectedProject() {
    return this._selectedProject;
  }
  public set  selectedProject(value) {
    console.log('Set Project::: ', value);
    //project change, need to make our 
    console.log('Old projectid: ', this.projectId);
    if(this.groupSubscription && !this.groupSubscription.closed) 
      this.groupSubscription.unsubscribe();
    if(this.eventSubscription && !this.eventSubscription.closed) 
      this.eventSubscription.unsubscribe();
    console.log('PPPPPPPPPPPPPPPPPPPPPP');
    console.log(this.groupSubscription, this.eventSubscription);

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

      this.eventSubscription = this.dataService.subscribeProjectCollectionChanges(this.projectId, EVENT_SERVICE)
        .subscribe(e => {
          console.log('State Node Update:: ', e);
          if(this.nodes.find(n=> n._id === e._id)){
            console.log('---- Editing::: ', e);
            if(e._deleted)
              this.removeNode(e);
            else
              this.updateNode(e);
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

  public get edge() {
    return this._edge;
  }
  public set edge(value) {
    this._edge = value;
    this.edgeSelectionChanged$.next(value);
  }

  public get node() {
    return this._node;
  }
  public set node(value) {
    this._node = value;
    this.nodeSelectionChanged$.next(value);
  }

  public get searchItems() {
    return this._searchItems;
  }
  public set searchItems(value) {
    this._searchItems = value;
  }


  public get nodes(): Array<EventItem> {
    return this._nodes;
  }
  public set nodes(value: Array<EventItem>) {
    this._nodes = value;
    this.nodes$.next(this._nodes);
  }

  public updateNode(node:EventItem){
    this.nodes = saveIntoArray(node, this.nodes);
  }

  public removeNode(node:EventItem){
    this.nodes = this.nodes.filter(n=> n._id !== node._id);
  }

}
