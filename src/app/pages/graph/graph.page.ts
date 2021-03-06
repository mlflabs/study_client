import { Component, OnInit,
  ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ModalController } from '../../../../node_modules/@ionic/angular';
import { saveIntoArray } from '../../utils';
import { DataService } from '../../services/data.service';
import { EVENT_SERVICE } from '../../models';


@Component({
  selector: 'app-graph',
  templateUrl: './graph.page.html',
  styleUrls: ['./graph.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GraphPage implements OnInit {

  nodes = [];
  edge;
  edge_meta = {from: '', to: '', to_obj: null, from_obj: null};

  search_term;
  searchItems = [];
  
  event_subscription;

  constructor(
    public dataService: DataService,
    public modalController: ModalController,
    public cdr: ChangeDetectorRef
  ) { }



  ngOnInit() {
    this.setup_subscriptions();
  }

  onNodeClicked(id){

  }

  onNodeDoubleClicked(id){

  }


  onSearchChange(){
    //const items = this.docService.searchByField(
    //    this.search_term, 'contents', EVENT_SERVICE, 10);

    // tslint:disable-next-line:prefer-const
    let searchItems = [];
    
    
  }

  searchItemSelected(item){
    console.log('SearchItemSelected: ', item);
  }

  onSubmitEdge(){
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

    this.dataService.save(from, EVENT_SERVICE);
    this.dataService.save(to, EVENT_SERVICE);
  }




  searchGraphModal(){
    console.log('searchGraphModal');
  }


  async setup_subscriptions(){
    this.event_subscription = this.dataService.subscribeCollectionChanges(EVENT_SERVICE)
      .subscribe(async docs =>{
        console.log('Subscripton sync event: ', docs);

        //see if a doc that we are showing changed


      });
  }

  redraw(){
    this.nodes = this.nodes.concat([]);
    this.cdr.detectChanges();
  }

}
