import { Component, OnInit, OnDestroy,
  ChangeDetectionStrategy, ChangeDetectorRef  } from '@angular/core';
import { StateService } from '../../services/state.service';
import { EdgeItem } from '../../models';
import { saveIntoArray } from '../../utils';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-edge-edit',
  templateUrl: './edge-edit.component.html',
  styleUrls: ['./edge-edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EdgeEditComponent implements OnInit, OnDestroy {
  
  subscription;
  heading = 'Edit Edge';
  edge:EdgeItem = new EdgeItem();
  changes = 0;

  constructor(public state: StateService, 
              public cdr: ChangeDetectorRef,
              public dataService: DataService) { }

  ngOnInit() {
    this.subscription = this.state.edgeSelectionChanged$.subscribe(edge=>{
      this.edge = Object.assign({}, edge);
      this.cdr.detectChanges();
    });
  }


  ngOnDestroy(){
    this.subscription.unsubscribe();
  }

  printTo(){
    if(!this.edge.to) return 'Not Selected';
    const to = this.state.nodes.find(n => n._id === this.edge.to);
    if(!to) return 'Not Found';
    return to.content || 'Not Selected';
  }

  printFrom(){
    if(!this.edge.from) return 'Not Selected';
    const from = this.state.nodes.find(n => n._id === this.edge.from);
    if(!from) return 'Not Found';
    return from.content;    
  }


  remove(){
    console.log('Remove: ', this.edge);
    console.log('Save: ', this.edge);
    const to = this.state.nodes.find(n => n._id === this.edge.to);
    const from = this.state.nodes.find(n => n._id === this.edge.from);

    to.to = to.to.filter(i => i.id !== this.edge.id);
    from.from = from.from.filter(i => i.id !== this.edge.id);

    this.dataService.save(to);
    this.dataService.save(from);

    console.log('Saving..........', to, from);

    this.state.eventItemAdd$.next(to);
    this.state.eventItemAdd$.next(from);
    this.state.edge = null;
    this.state.showEditEdge = false;
  }

  save(){
    console.log('Save: ', this.edge);
    const to = this.state.nodes.find(n => n._id === this.edge.to);
    const from = this.state.nodes.find(n => n._id === this.edge.from);

    to.to = saveIntoArray(this.edge,to.to, 'to');
    from.from = saveIntoArray(this.edge, from.from, 'from');

    this.dataService.save(to);
    this.dataService.save(from);

    console.log('Saving..........', to, from);

    this.state.eventItemAdd$.next(to);
    this.state.eventItemAdd$.next(from);
  }

}
