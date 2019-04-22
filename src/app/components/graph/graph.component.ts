import { Component, ViewChild, ElementRef, 
  AfterViewInit,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChange} from '@angular/core';
import { newEdge, EdgeItem } from '../../models';
import * as vis from 'vis';
import { saveIntoArray } from '../../utils';



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
  public edge_meta;

  @Input() nodes = [];

  @Output() nodeSelected = new EventEmitter<String>();
  @Output() nodeDoubleClicked = new EventEmitter<String>();
  @Output() edgeSelected = new EventEmitter<String>();
  @Output() newEdge = new EventEmitter<EdgeItem>();

  graph_options = {
    autoResize: true,
    height: '100%',
    width: '100%',
    clickToUse: false,
    manipulation: {
      addNode: false,
      editNode: false,
      deleteNode:  false,
      editEdge: false,
      deleteEdge: false,
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
          this.newEdge.emit(edge);
          cb(edge);
        }
      }
    },
  };


  constructor() { }

  ngAfterViewInit() {
    console.log('VIS_GRAPH -> AfterViewINIT');
    this.vis_graph = new vis.Network(this.graph_ref.nativeElement, {
      nodes: [],
      edges: []
    }, this.graph_options);
    //console.log(this.vis_graph);
    this.setup();
  }


  setup(){
    this.vis_graph.on('selectNode', (props)=> {
      //console.log('graph select edge: ', props);
      if(props.nodes.length === 1){
        this.nodeSelected.emit(props.nodes[0]);
      }
      
      //this.selectedGraphItem = node;
      //this.cdr.detectChanges();
    });

    this.vis_graph.on('selectEdge', (props)=> {
      console.log('graph, select edge: ', props);
      if(props.edges.length === 1){
        this.edgeSelected.emit(props.edges[0]);
      }
    });

    this.vis_graph.on('deselectNode', (props)=> {
      console.log('graph node deselect: ', props);
      if(props.nodes.length === 0)
        this.nodeSelected.emit(null);
        //this.nodeClicked.emit(null);
        //this.selectedGraphItem = null;
        //this.cdr.detectChanges();
    });

    this.vis_graph.on('deselectEdge', (props)=> {
      console.log('graph - deselect edge: ', props);
      if(props.edges.length === 0){
        this.edgeSelected.emit(null);
      }
    });

    this.vis_graph.on('doubleClick', props => {
      console.log('graph doubleclick:: ', props);
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

  public addNodesToGraph(node) {
    //console.log('AddNodesToGraph, Comp: ', node);
    if(Array.isArray(node)){
      //console.log('Adding multiple nodes to graph: ', node);
      node.forEach(n => {
        this.nodes = saveIntoArray(n, this.nodes);
      });
    }
    else {
      //console.log('Adding Node: ', node);
      this.nodes = saveIntoArray(node, this.nodes);
    }
    this.redraw();
  }

  public setNodes(nodes) {
    this.nodes = nodes;
    this.redraw();
  }


  ngOnChanges(changes: {[propKey: string]: SimpleChange}) {
    //console.log('SimpleChanne', changes);
    if(!this.vis_graph) return; //graph hasn't fully loaded yet
    //console.log('OnChanges: ', changes);

    if(changes['nodes']){
      //console.log('Nodes Have Changed');
      this.redraw();
    }
  }

  redraw(fit = false, redraw=false) {
    if(!this.vis_graph) return;


    this.nodes.map(n =>{
      n.label = n.content;
    });

    this.loadEdges();

    //console.log('Graph Nodes: ', this.nodes);
    //console.log('Graph Edges: ', this.edges);

    this.vis_graph.setData({
      nodes: this.nodes,
      edges: this.edges
    });

    if(fit)
      this.vis_graph.fit();

    if(redraw)
      this.vis_graph.redraw();
  }

  loadEdges(){
    const edges = [];
    this.nodes.forEach(n => {
         //console.log('N: ', n);
         if(!n.to) n.to = new Array();
         n.to.forEach(to=> {
           //console.log('TO::::: ', to);
           const found = this.nodes.find(node => node._id === to.from );
           //console.log('Found: ', found);
           if(found){
             edges.push(to);
           }
         });
    });

    this.edges = edges;
    //console.log('LoadEdges:::: ', this.edges);
    return this.edges;
  }




  

}
