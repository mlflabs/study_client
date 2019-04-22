import { NgModule } from '@angular/core';
import { TimelineComponent } from './timeline/timeline.component';
import { GraphComponent } from './graph/graph.component';
import { EdgeEditComponent } from './edge-edit/edge-edit.component';
import { EventSearchComponent } from './event-search/event-search.component';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GroupSelectComponent } from './group-select/group-select.component';

@NgModule({
  declarations: [    
    TimelineComponent,
    GraphComponent,
    EdgeEditComponent,
    EventSearchComponent,
    GroupSelectComponent,],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
  ],
  exports: [
    TimelineComponent,
    GraphComponent,
    EventSearchComponent,
    EdgeEditComponent,
    GroupSelectComponent,
  ]
})
export class ComponentsModule { }
