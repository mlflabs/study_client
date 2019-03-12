import { Component, OnInit, AfterViewInit, ChangeDetectionStrategy, 
         ChangeDetectorRef } from '@angular/core';
import { ModalController, ToastController, MenuController } from '@ionic/angular';
import * as moment from 'moment';
import { EditEventPage } from '../edit-event/edit-event.page';
import { DataService } from '../../services/data.service';
import { EVENT_SERVICE, GROUP_SERVICE } from '../../models';

import { saveIntoArray } from '../../utils';
import { StateService } from '../../services/state.service';
//import { Sort } from '../../sort.pipe';
@Component({
  selector: 'app-list',
  templateUrl: 'list.page.html',
  styleUrls: ['list.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListPage implements OnInit {

  public groups = [];
  public visible_groups = [];
  public images = [];
  //public eventItem: EventItem = new EventItem();
  public groupSubscription;
  public eventSubscription;
  public selectedID;

  // graph
  public nodes = [];
  public edge = {};
  public edge_meta = {from: '', to: '', to_obj: null, from_obj: null};
  //public eventSelected = false; //show edit node/even from or not
  //public editingEdge = false; //show edit edge from or not
  //public search = '';
  //public searchItems = [];
  //public groups = [];
  //public visible_groups = [];
  //public items = []; // new vis.DataSet(this.vis_dataset_options);
  //public subscription: any;
  //public timelineStats = {start:'', end:'', size:'', span:'', days: 0};
  //selectedGraphItem = null;

  constructor(
    public dataService: DataService,
    public state: StateService,
    public modalController: ModalController,
    public toastController: ToastController,
    public menuController: MenuController,
    public cdr: ChangeDetectorRef) {

  }

  ngOnInit() {
    this.setup_subscriptions();
  }
  

  onNodeClicked(id){

  }

  onNodeDoubleClicked(id){

  }




















  async loadEventImage(event) {
    if(!event.icon)return;
    if(this.images[event.icon])return;//already have image loaded

    const doc = await this.dataService.getDoc(event.icon, true);

    const s = 'data:'+doc._attachments['file']['content_type'] +
              ';base64, ' + 
              doc._attachments['file']['data'];
    this.images[doc._id] = s;
  }

  async setup_subscriptions(){

    this.eventSubscription = this.dataService.subscribeProjectCollectionChanges(
                               this.state.projectId, EVENT_SERVICE)
      .subscribe(async doc =>{

        //we have event change, lets force redraw only if
        //event belongs to visible groups
        //TODO: for now we assume only one event changed
        const group = this.visible_groups.find(g => g.id === doc.group);
        if(group){
          
          if(doc._deleted){
            group.events = group.events.filter(item => item._id !== doc._id);
          }
          else {
            group.events = saveIntoArray(doc,group.events,'id');
            this.loadEventImage(doc);
          }
          this.visible_groups = this.visible_groups.concat([]);
          this.cdr.detectChanges();
        }
      });

    this.groupSubscription = this.state.groups$.subscribe(groups => {
      this.groups = groups;
      this.refreshGroups();
    });

    
  }

  redraw() {
    this.visible_groups = this.groups.filter(g => g.visible);
    this.cdr.detectChanges();
  }

  async refreshGroups(){
    this.groups.forEach(async g =>{
      if(g.visible){
        if(!g.events || g.events.length === 0){
          g.events = await this.dataService.getByQuery({
            selector: { 
              $and: [
                { group: g.id },
                {
                  _id: {
                    $gte: this.state.projectId+ '|' + EVENT_SERVICE,
                    $lt: this.state.projectId+ '|' + EVENT_SERVICE+'|'+String.fromCharCode(65535)
                  }
                }
    
              ]
            },
          });
        }
      }
      else{
        g.events = [];
      }

      //load images
      g.events.forEach(async e => {
        await this.loadEventImage(e);
      });
    });
    this.redraw();
  }


  async onEventClicked(id){
  
  }

  async onEventUpdate(id){
    this.edititem(id);
  }

  async edititem(id){
    const item = await this.dataService.getDoc(id);
      if(item)
        this.showEditEventModal(item);
  }

  onEventDiselected(){
  }
  onEventAdded(item){
    this.showEditEventModal(item);
  }

  async showEditEventModal(item) {
    const modal = await this.modalController.create({
      component: EditEventPage,
      componentProps: { item: item,
                        groups: this.groups }
    });
    modal.present();
  }


  printGroupById(id){
    const group = this.groups.find(g => g.id === id);
    if(group){
      return ' -- ' + group.content;
    }
    else {
      return '';
    }
  }

  printStartDate(item){
    if(item.start){
      return  moment(item.start).format('YYYY-MM-DD');
    }
    else {
      return '';
    }
  }

  printEndDate(item){
    if(item.end){
      return ' -- '+ moment(item.end).format('YYYY-MM-DD');
    }
    else {
      return '';
    }
  }

  toggleMenu(){
    this.menuController.toggle('right');
  }

}









  /*
  onSubmitEdge() {
    console.log('onSubmitEdge');
    //find our 2 edges
    const from = this.edge_meta.from_obj;
    const to = this.edge_meta.to_obj;

    //make sure we have alraedy to, from array item, 
    //they are not required by default for new objects
    if(!to.to)to.to = [];
    if(!from.from)from.from =[];
    console.log('@@@@@SAVING EDGE: ', this.edge);
    //see if we are adding or modifying
    to.to = saveIntoArray(this.edge,to.to,'id');
    from.from = saveIntoArray(this.edge, from.from, 'id');

    this.docService.save(from, EVENT_SERVICE);
    this.docService.save(to, EVENT_SERVICE);
    //this.eventService.save(from);
    //this.eventService.save(to);

  }
  */

  //need to implement better remove mechanism
  /*removeItem2(doc) {
    console.log('Removing event: ', doc);
    this.docService.delete(doc, EVENT_SERVICE);
    //this.eventService.remove(doc);

  }*/


  
  //addNodeConnection(){
    //this.vis_graph.addEdgeMode();
  //}

  //graphNodeEdit(){
  //  console.log('graphNodeEdit');
  //  this.eventItem = this.items.find(i => i._d === this.selectedGraphItem);
  /*/}

  /
  graphNodeRemoveFromGraph(){
    console.log('graphNodeRemoveFromGraph');
    const node = this.items.find(i => i._id === this.selectedGraphItem);
    
    this.removeNodeFromGraph(node);
    this.selectedGraphItem = null;

  }
  */

  /*
  graphNodeDelete(){
    console.log('graphNodeDelete');
  }
  */

  /*
  searchItemSelected(item){
    console.log('SearchItemSelected: ', item);

    //see if node is already displayed
    if(this.graph_nodes.find(i=>i.label === item.content)){
      console.log('Item Already in Graph');
    } 
    else {
      console.log('Adding item to Graph');
      this.addNodesToGraph(item);
    }
  }
  */

  /*
  onSearchChange(){
    console.log('Search: ', this.search);
    let max = 10;
    // tslint:disable-next-line:prefer-const
    let searchItems = [];
    
    for(let i = 0; i < this.items.length; i++){
      if(!this.items[i].content) continue;
      if(this.items[i].content.includes(this.search)){
        searchItems.push(this.items[i]);
        max--;
      }
      if(max < 0)break;
    }
    console.log('SearchItems: ', searchItems);
    this.searchItems = searchItems;
  }*/

  

  /*
  onEditEventClick(){
    this.showEditEventModal();
  }
  */

  
  /*
  setupEditEdge(edge){
    //find both nodes, and get their names
    console.log(this.items);
    const to = this.items.find(n => n._id === edge.to);
    const from = this.items.find(n => n._id === edge.from);
    console.log('SetupEditEdge 2 Nodes: ', edge, from, to);
    this.edge_meta = {to: to.content, 
                      from: from.content,
                      to_obj: to,
                      from_obj:from};
    this.editingEdge = true;
    this.edge = edge;
    this.cdr.detectChanges();
  }
  */

  /*
  updateGraphNode(node){
    //lets see if in graph, if so lets modify it
    const duplicateNode = this.graph_nodes.find(d => node._id === d.id);
    if(duplicateNode){
      console.log('Found a doc to replace in graph', duplicateNode); 
      console.log('this.graph_nodes: ', this.graph_nodes);
      this.graph_nodes = saveIntoArray(node, this.graph_nodes);


      this.redraw_graph(this.graph_nodes, false);
    }
  }*/


  /*
  addNodesToGraph(node){
    if(Array.isArray(node)){
      console.log('Adding multiple nodes to graph: ', node);
      node.forEach(n => {
        n.label = n.content;
        this.graph_nodes = saveIntoArray(n, this.graph_nodes);
      });
    }
    else {
      console.log('Adding Node: ', node);
      node.label = node.content; //format node
      this.graph_nodes = saveIntoArray(node, this.graph_nodes);
    }

    this.redraw_graph(this.graph_nodes, false);
  }
  */

  /*
  removeNodeFromGraph(node){
    console.log('Remvoing Node', node, this.graph_nodes);
    if(!node) return;
    this.graph_nodes = this.graph_nodes.filter(n=> n.id !== node.id);
    console.log(this.graph_nodes);
    this.redraw_graph(this.graph_nodes, false);
  }
  */

