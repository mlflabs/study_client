import { NgModule } from '@angular/core';
import { TimelineComponent } from './timeline/timeline.component';
import { GraphComponent } from './graph/graph.component';

@NgModule({
  declarations: [    
    TimelineComponent,
    GraphComponent,],
  imports: [],
  exports: [
    TimelineComponent,
    GraphComponent,
  ]
})
export class ComponentsModule { }
