import { Component, ViewChild, ElementRef, 
  AfterViewInit,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChange} from '@angular/core';
import { newEdge } from '../../models';
import * as vis from 'vis';



@Component({
  selector: 'app-graphs',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.scss']
})
export class GraphComponent implements AfterViewInit, OnChanges {

  @ViewChild('visgraph', { read: ElementRef })
  graph_ref: ElementRef;

  vis_graph = null;//hold vis implementation of graph
  edges = [];

  @Input()
  nodes = [];

  @Output() nodeClicked = new EventEmitter<String>();
  @Output() nodeDoubleClicked = new EventEmitter<String>();

  graph_options = {
    autoResize: true,
    height: '100%',
    width: '100%',
    clickToUse: false,
    manipulation: {
      addNode:this.addNode,
      editNode: this.editNode,
      deleteNode: this.deleteNode,
      addEdge: this.addEdge,
    }
  };


  constructor() { }

  ngAfterViewInit() {
    this.vis_graph = new vis.Network(this.graph_ref.nativeElement, {
      nodes: [],
      edges: []
    }, this.graph_options);

    this.setup();
  }


  setup(){
    this.vis_graph.on('selectNode', (props)=>{

      const node = props.nodes[0];
      this.nodeClicked.emit(node);
      //this.selectedGraphItem = node;
      //this.cdr.detectChanges();
    });

    this.vis_graph.on('selectEdge', (props)=>{
    });

    this.vis_graph.on('deselectNode', (props)=>{

      if(props.nodes.length === 0)
        this.nodeClicked.emit(null);
        //this.selectedGraphItem = null;
        //this.cdr.detectChanges();
    });

    this.vis_graph.on('deselectEdge', (props)=>{
    });

    this.vis_graph.on('doubleClick', props =>{
      //if we click on node, lets put it into edits
      if(props.nodes.length > 0){

        this.nodeDoubleClicked.emit(props.nodes[0]);
        //this.cdr.detectChanges();

        //lets load all related nodes
        /*
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
        */
      }
    });

  }

  async addNode(item, cb){
    console.log('Graph Item added: ', item);
    //let newitem = new EventItem({...item, ...{id: null, _id: null}});
    //newitem = await this.docService.save(newitem, EVENT_SERVICE);
    //newitem = this.eventService.save(newitem);
    //cb(newitem);
  }

  editNode(data, cb){
    console.log('OnEditNode: ', data);
    cb(data);
  }


  deleteNode(data, cb){
    console.log('deleteNode: ', data);
    cb(data);
  }

  addEdge(data, cb){
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

  ngOnChanges(changes: {[propKey: string]: SimpleChange}) {
    console.log('OnChanges: ', changes);

    if(changes['nodes']){
      console.log('Nodes Have Changed');
      this.redraw();
    }
  }

  redraw(fit = false, redraw=false){
    
    this.nodes.map(n =>{
      n.label = n.content;
    });

    //this.graph_nodes = nodes;

    //lets figure out edges, which ones have both ends
    const edgeHash = {};
    this.nodes.forEach(n => {
         console.log('N: ', n);
         if(!n.to) n.to = new Array();
         if(!n.from) n.from = new Array();

         n.to.forEach(to=> edgeHash[to.id]=to);
         n.from.forEach(from => edgeHash[from.id]=from);
    });

    this.edges = Object.values(edgeHash);

    console.log('Graph Nodes: ', this.nodes);
    console.log('Graph Edges: ', this.edges);

    this.vis_graph.setData({
      nodes: this.nodes,
      edges: this.edges
    });

    if(fit)
      this.vis_graph.fit();

    if(redraw)
      this.vis_graph.redraw();
  }

  setupEditEdge(edge){
    //find both nodes, and get their names
    console.log(this.nodes);
    //const to = this.items.find(n => n._id === edge.to);
    //const from = this.items.find(n => n._id === edge.from);
    //console.log('SetupEditEdge 2 Nodes: ', edge, from, to);
    //this.edge_meta = {to: to.content, 
    //                  from: from.content,
    //                  to_obj: to,
    //                  from_obj:from};
    //this.editingEdge = true;
    //this.edge = edge;
    //this.cdr.detectChanges();

    
  }
  


  

}
