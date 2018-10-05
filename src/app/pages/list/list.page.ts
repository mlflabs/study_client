import { Component, ViewChild, ElementRef, 
  OnInit, AfterViewInit, ChangeDetectionStrategy, 
  ChangeDetectorRef } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Doc, EventItem, newEdge } from '../../models/doc.model';
import { EventsService } from '../../services/events.service';
import * as vis from 'vis';
import * as moment from 'moment';
import { GroupsService } from '../../services/groups.service';
import { timeout } from '../../../../node_modules/rxjs/operators';
import { saveIntoArray } from '../../utils';
import { EditEventPage } from '../edit-event/edit-event.page';
import { DocService, EVENT_SERVICE, GROUP_SERVICE } from '../../services/doc.service';
//import { Sort } from '../../sort.pipe';
@Component({
  selector: 'app-list',
  templateUrl: 'list.page.html',
  styleUrls: ['list.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListPage implements OnInit, AfterViewInit {

  @ViewChild('timeline', { read: ElementRef })
  timeline_ref: ElementRef;

  @ViewChild('graph', { read: ElementRef })
  graph_ref: ElementRef;

  public eventItem: EventItem = new EventItem();
  public edge = {};
  public edge_meta = {from: '', to: '', to_obj: null, from_obj: null};
  public eventSelected = false; //show edit node/even from or not
  public editingEdge = false; //show edit edge from or not
  public search = '';
  public searchItems = [];
  public groups = [];
  //public visible_groups = [];
  public items = []; // new vis.DataSet(this.vis_dataset_options);
  public subscription: any;
  public timelineStats = {start:'', end:'', size:'', span:''};
  
  selectedGraphItem = null;

  vis_timeline = null;
  vis_graph = null;

  vis_options = {
    editable: {
      add: true,
      updateTime: true,
      updateGroup: true,
      remove: true
    },   // default for all items
    stack: false,
    stackSubgroups: false,
    clickToUse: false,
    maxHeight: 800,
    minHeight: 200,
    groupOrder: 'content',
    order: this.customOrder,
    // min: new Date(2012, 0, 1),                // lower limit of visible range
    // max: new Date(2013, 0, 1),                // upper limit of visible range
    // zoomMin: 1000 * 60 * 60 * 24,             // one day in milliseconds
    // zoomMax: 1000 * 60 * 60 * 24 * 31 * 3     // about three months in milliseconds
    onAdd: (item, callback) => {
      console.log('Item added: ', item);
      const newitem = new EventItem({...item, ...{ type: 'box', id: null, _id: null}});
      this.docService.save(newitem, EVENT_SERVICE);
      //this.eventService.save(newitem);
      callback(null);
    },
    onUpdate: (item, callback) => {
      console.log('OnUpdate: ', item);
      callback(item);
      /*
      prettyPrompt('Update item', 'Edit items text:', item.content, function (value) {
        if (value) {
          item.content = value;
          callback(item); // send back adjusted item
        }
        else {
          callback(null); // cancel updating the item
        }
      });
      */
    },
    onRemove: (item, callback) => {
      console.log('Removing Item: ', item);
      callback(item);
    }
  };

  graph_nodes = [];
  /*[
    {id: 1, label: 'Node 1'},
    {id: 2, label: 'Node 2'},
    {id: 3, label: 'Node 3'},
    {id: 4, label: 'Node 4'},
    {id: 5, label: 'Node 5'}
  ];*/

  graph_edges = [];
  /*[
    {from: 1, to: 2, label: 'middle',     font: {align: 'middle'},  arrows:'to', dashes:true},
    {from: 1, to: 3, label: 'top',        arrows:{middle:{scaleFactor:0.5},from:true}},
    {from: 2, to: 4, label: 'horizontal', font: {align: 'horizontal'}, arrows:'to, middle'},
    {from: 2, to: 5, label: 'bottom',     font: {align: 'bottom'},arrows:'to, middle, from'}
  ];*/

  graph_options = {
    autoResize: true,
    height: '100%',
    width: '100%',
    clickToUse: false,
    manipulation: {
      addNode: async (item, cb) => {
        console.log('Graph Item added: ', item);
        let newitem = new EventItem({...item, ...{id: null, _id: null}});
        newitem = await this.docService.save(newitem, EVENT_SERVICE);
        //newitem = this.eventService.save(newitem);
        cb(newitem);
      },
      editNode: (data, cb) => {
        console.log('OnEditNode: ', data);
        cb(data);
      },
      deleteNode: (data, cb) => {
        console.log('deleteNode: ', data);
        cb(data);
      },
      addEdge: (data, cb) => {
        console.log('onAddEdge: ', data);
        if (data.from === data.to) {
          //var r = confirm("Do you want to connect the node to itself?");
          //if (r == true) {
           // callback(data);
          //}
        }
        else {
          const edge  = newEdge({to: data.to, from: data.from});
          this.setupEditEdge(edge);
          cb(edge);
        }
      }
    }
  };

  constructor(
    public docService: DocService,
    public modalController: ModalController,
    public cdr: ChangeDetectorRef) {

  }

  ngOnInit() {
  }
  
  ngAfterViewInit(): void {
    console.log('ngAfterViewInit');
    console.log(this.timeline_ref.nativeElement.textContent);
    this.vis_timeline = new vis.Timeline(this.timeline_ref.nativeElement, this.items, this.vis_options);
    this.setup_timeline();
    
    console.log(this.timeline_ref.nativeElement);
    this.timelineStats.size = this.timeline_ref.nativeElement.offsetHeight;

    console.log(this.graph_ref.nativeElement.textContent);
    this.vis_graph = new vis.Network(this.graph_ref.nativeElement, {
      nodes: this.graph_nodes,
      edges: this.graph_edges
    }, this.graph_options);
    this.setup_network();
    

    this.setup_subscriptions();

    setTimeout(() => {

      
      this.redraw_timeline(true);
      //this.vis_timeline.redraw();
      //this.vis_timeline.fit();
      this.vis_timeline.zoomIn(0.1);
      this.cdr.detectChanges();
      this.vis_timeline.redraw();
    }, 1000);

    setTimeout(() => {

      this.vis_graph.redraw();
      this.vis_graph.fit();
      

      this.redraw_timeline(true);
      this.vis_timeline.zoomIn(0.1);
      this.vis_timeline.redraw();
      this.cdr.detectChanges();
    }, 2000);

    setTimeout(() => {
      this.redraw_timeline(true);
      this.cdr.detectChanges();
    }, 3000);
    setTimeout(() => {
      this.redraw_timeline(true);
      this.cdr.detectChanges();
    }, 4000);
  }

  onGroupChange(group) {
    console.log('Group Changed: ', group);
    group.visible = !group.visible;
    group.showNested = true;
    this.redraw_timeline();
    //this.groupService.save(Object.assign({}, group));
  }


  move(percentage) {
    const range = this.vis_timeline.getWindow();
    const interval = range.end - range.start;

    this.vis_timeline.setWindow({
      start: range.start.valueOf() - interval * percentage,
      end: range.end.valueOf() - interval * percentage
    });
  }

  customOrder(a, b) {
    return a.id - b.id; // or by priority
  }



  onSubmit() {
    console.log('Saving event: ', this.eventItem);
    this.docService.save(Object.assign({}, { _id: null }, 
                         this.eventItem), EVENT_SERVICE);
    //this.eventService.save(Object.assign({}, { _id: null }, this.eventItem));

  }

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

  //need to implement better remove mechanism
  removeItem2(doc) {
    console.log('Removing event: ', doc);
    this.docService.delete(doc, EVENT_SERVICE);
    //this.eventService.remove(doc);

  }


  setup_network(){
    this.vis_graph.on('selectNode', (props)=>{
      console.log('selectNode', props.nodes[0]);

      const node = props.nodes[0];
      this.selectedGraphItem = node;

      this.cdr.detectChanges();
    });

    this.vis_graph.on('selectEdge', (props)=>{
      console.log('selectEdge', props);
    });

    this.vis_graph.on('deselectNode', (props)=>{
      console.log('deselectNode', props);

      if(props.nodes.length === 0)
        this.selectedGraphItem = null;

      this.cdr.detectChanges();
    });

    this.vis_graph.on('deselectEdge', (props)=>{
      console.log('deselectEdge', props);
    });

    this.vis_graph.on('doubleClick', props =>{
      console.log('doubleclick: ', props);
      //if we click on node, lets put it into edits
      if(props.nodes.length > 0){
        console.log('Graph Editing item: ', this.items.find(i => i._id === props.nodes[0]));
        this.eventItem = this.items.find(i => i._id === props.nodes[0]);
        this.cdr.detectChanges();

        //lets load all related nodes
        const newnodes = {};
        this.eventItem.from.forEach(edge => {
          const node = this.items.find(i => i._id ===  edge.to);
          newnodes[node._id] = node;
        });
        this.eventItem.to.forEach(edge => {
          const node = this.items.find(i => i._id === edge.from);
          newnodes[node._id] = node;
        });
        console.log('Related nodes to add: ', newnodes);
        this.addNodesToGraph(Object.values(newnodes));
      }
    });

  }

  addNodeConnection(){
    this.vis_graph.addEdgeMode();
  }

  graphNodeEdit(){
    console.log('graphNodeEdit');
    this.eventItem = this.items.find(i => i._d === this.selectedGraphItem);
  }

  graphNodeRemoveFromGraph(){
    console.log('graphNodeRemoveFromGraph');
    const node = this.items.find(i => i._id === this.selectedGraphItem);
    
    this.removeNodeFromGraph(node);
    this.selectedGraphItem = null;

  }

  graphNodeDelete(){
    console.log('graphNodeDelete');
  }

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
  }

  onSelectTimelineEvent(props){
    // lets see if we are selecting or de-selecting
    if(props.items.length === 0){
      this.eventSelected = false;
      //if deselecting, do nothing to graph
    }
    else {
      this.eventSelected = true;
      const i = this.items.find(doc => doc._id === props.items[0]);
      this.eventItem = Object.assign({}, i);
      console.log('selected this.item: ', this.eventItem);
      this.cdr.detectChanges();

      this.addNodesToGraph(i);
    }
  }

  onEditEventClick(){
    this.showEditEventModal();
  }

  async showEditEventModal() {
    const modal = await this.modalController.create({
      component: EditEventPage,
      componentProps: { item: this.eventItem,
                        groups: this.groups }
    });
    modal.present();
  }


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


  updateGraphNode(node){
    //lets see if in graph, if so lets modify it
    const duplicateNode = this.graph_nodes.find(d => node._id === d.id);
    if(duplicateNode){
      console.log('Found a doc to replace in graph', duplicateNode); 
      console.log('this.graph_nodes: ', this.graph_nodes);
      this.graph_nodes = saveIntoArray(node, this.graph_nodes);


      this.redraw_graph(this.graph_nodes, false);
    }
  }


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

  removeNodeFromGraph(node){
    console.log('Remvoing Node', node, this.graph_nodes);
    if(!node) return;
    this.graph_nodes = this.graph_nodes.filter(n=> n.id !== node.id);
    console.log(this.graph_nodes);
    this.redraw_graph(this.graph_nodes, false);
  }


  redraw_graph(nodes, fit = false, redraw=true){
    
    nodes.map(n =>{
      n.label = n.content;
    });

    this.graph_nodes = nodes;

    //lets figure out edges, which ones have both ends
    const edgeHash = {};
    this.graph_nodes.forEach(n => {
         console.log('N: ', n);
         if(!n.to) n.to = new Array();
         if(!n.from) n.from = new Array();

         n.to.forEach(to=> edgeHash[to.id]=to);
         n.from.forEach(from => edgeHash[from.id]=from);
    });

    this.graph_edges = Object.values(edgeHash);

    console.log('Graph Nodes: ', nodes);
    console.log('Graph Edges: ', this.graph_edges);

    this.vis_graph.setData({
      nodes: this.graph_nodes,
      edges: this.graph_edges
    });

    if(fit)
      this.vis_graph.fit();

    if(redraw)
      this.vis_graph.redraw();
  }

  onResize(event){
    console.log('Window resize: ',event.target.innerWidth, event);
    this.timelineStats.size = event.target.innerWidth;
    this.cdr.detectChanges();
  }

  setup_timeline(){
    this.vis_timeline.on('rangechange', function (properties) {
      console.log('rangechange', properties);
    });

    this.vis_timeline.on('rangechanged', props => {
      console.log('rangechanged', props);
      const start = moment(props.start);
      const end = moment(props.end);
      const span = moment.duration(end.diff(start));
      const size = '';
      this.timelineStats.start = start.format('YYYY-MM-DD');
      this.timelineStats.end = end.format('YYYY-MM-DD');
      this.timelineStats.size = this.timeline_ref.nativeElement.offsetWidth;
      this.timelineStats.span = span.asDays()+' Days :::: ' + Number(this.timelineStats.size)/span.asDays();
      this.cdr.detectChanges();
      console.log('Timeline resize data: ', this.timelineStats);

      //have to figure our dividers
      //1 day

    });


    // when we select item in timeline, lets make it the editable item
    this.vis_timeline.on('select', (properties) => {
      this.onSelectTimelineEvent(properties);
    });

    this.vis_timeline.on('itemover', function (properties) {
      console.log('itemover', properties);
      console.log(properties.item);
    });

    this.vis_timeline.on('itemout', function (properties) {
      console.log('itemout', properties);
      console.log('none');
    });

    this.vis_timeline.on('click', p => {
      console.log('CLICK', p);
    });

    this.vis_timeline.on('click', props => {
      console.log('click!!!!!', props);
      /*if(props['what'] === 'group-label'){
        console.log('group-label');
        //see if this group is in our visible groups, and if its nested
        const group = this.groups.find(g => g._id === props['group']);
        console.log(group);
        if(group['nestedGroups']){
          group['showNested'] = (group['showNested'] === true);
          console.log('New Group: ', group);
          this.redraw_timeline();
        } 
      }*/
    });

    this.vis_timeline.on('doubleClick', async props => {
      console.log('doubleClick', props);
      
      if(props.item){
        this.eventItem = await this.docService.getDocById(props.item, EVENT_SERVICE);
        this.showEditEventModal();

      }
      

    });

    this.vis_timeline.on('contextmenu', function (properties) {
      console.log('contextmenu', properties);
    });

    this.vis_timeline.on('mouseDown',  properties => {
      console.log('mouseDown', properties);
    });

    this.vis_timeline.on('mouseUp', props => {
      console.log('mouseUp', props);
      if(props['what'] === 'group-label'){
        console.log('group-label');
        //see if this group is in our visible groups, and if its nested
        const group = this.groups.find(g => g._id === props['group']);
        console.log(group);
        if(group['nestedGroups']){
          group['showNested'] = (group['showNested'] === false);
          console.log('New Group: ', group);
          this.redraw_timeline();
        } 
      }
    });

    document.getElementById('zoomIn').onclick = () => { this.vis_timeline.zoomIn(0.2); };
    document.getElementById('zoomOut').onclick = () => { this.vis_timeline.zoomOut(0.2); };
    document.getElementById('moveLeft').onclick = () => { this.move(0.2); };
    document.getElementById('moveRight').onclick = () => { this.move(-0.2); };
    document.getElementById('fitContents').onclick = () => { this.vis_timeline.fit(); };
    // document.getElementById('toggleRollingMode').onclick = () => { this.vis_timeline.toggleRollingMode(); };

  }

  async setup_subscriptions(){

    this.subscription = this.docService.subscribeChanges(EVENT_SERVICE)
      .subscribe(async docs =>{
        //lets see if we need to refresh all or just an item
        
        this.items = await this.docService.getAllDocs(EVENT_SERVICE);
        
        const doc = docs[0];

        if(doc._removed){
          //lets see if the item is in graph, if so remove it 
          this.removeNodeFromGraph(doc);
        }
        else{
          this.updateGraphNode(doc);
        }

        this.redraw_timeline();
      });

    /*this.subscription = this.eventService.getDocsObservable().subscribe(
      docs => {
        console.log('event list docs refreshed', docs);
        this.items = (docs);
        this.redraw_timeline();
      }
    );
    */
   
    this.docService.subscribeChanges(GROUP_SERVICE)
      .subscribe( async docs => {
        const allDocs = await this.docService.getAllDocs(GROUP_SERVICE);
        console.log('Groups:::: ', allDocs);
        this.groups = allDocs.sort((a,b) => {
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
        this.redraw_timeline(true);
      }
    );


    this.items = await this.docService.getAllDocs(EVENT_SERVICE);
    this.groups = await this.docService.getAllDocs(GROUP_SERVICE);
    this.redraw_timeline();
    //this.groupService.loadAllDocs();
    //this.eventService.loadAllDocs();
  }



  redraw_timeline(fit = false) {
    console.log('REDRAWING....', this.groups);

    // filter which groups are visible
    const tempVisibleGroups = this.groups.filter(doc => doc.visible);
    //keep track of subnested groups, later on we have to check its visibility
    let subgroups = [];
    const visible_groups = this.groups
      .filter(doc => doc.visible)
      .map(doc => {
        doc.id = doc._id;

        //see if we have nestedInGroups, if so, make sure they are in display array
        if(doc['_nestedGroups'] && doc._nestedGroups.length !== 0){ //does it have nested groups
          if(doc['showNested']){ //does it suppose to display these groups
            doc.nestedGroups = doc._nestedGroups
              .filter(groupId => tempVisibleGroups.find(dd => dd._id === groupId) !== undefined);
          }
          else {
            doc.nestedGroups = [];
            //to later hide these groups, they are invisible
            subgroups = subgroups.concat(doc._nestedGroups);
            console.log('Subgroups concat: ', subgroups);
          }
        }
        else {
          delete doc.nestedGroups;
        }
        return doc;
      })
      //finally filter the groups by invisible subnested ids
      .filter(doc => subgroups.find(id => id === doc.id) === undefined);
      //finally filter the groups, see if we have any invisible groups 
      /*
      .map(doc => {
        console.log('Doc, subgroups: ', doc, subgroups);
        const subgroup = subgroups.find(sg => sg === doc._id);
        console.log('Subgroup: ', subgroup);
        if(subgroup)
          doc.visible = false;
        else
          doc.visible = true;

        return doc;
      });*/
    
    

    // based on visible groups, not filter which events are visible
    const visible_events = this.items
      .filter(item => {
        for (let i = 0; i < visible_groups.length; ++i) {
          if (item.group === visible_groups[i].id) {
            return true;
          }
        }
        return false;
      }).map(doc => { // vis only works with id, not _id
        doc.id = doc._id;
        return doc;
      });

    console.log('Visible: ', visible_groups, visible_events);

    this.vis_timeline.setGroups(visible_groups);
    this.vis_timeline.setItems(visible_events);

    if(fit){
      this.vis_timeline.fit();
    }

    //this.vis_timeline.redraw();
    this.cdr.detectChanges();
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

}
