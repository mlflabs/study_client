import { Component, ViewChild, ElementRef, AfterViewInit, ChangeDetectionStrategy, 
  ChangeDetectorRef, 
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  SimpleChange,
  OnChanges} from '@angular/core';
import { EventItem, RANGE_LEVELS } from '../../models';
//import * as vis from 'vis';
import * as timeline from 'timeline-plus';
import * as moment from 'moment';
import { DataService } from '../../services/data.service';
import { Item } from '../../../../node_modules/@ionic/angular';
//import { DataService } from '../../services/data.service';
//import { Events, Item } from '../../../../node_modules/@ionic/angular';

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimelineComponent implements OnChanges, OnDestroy, AfterViewInit {
  
  @ViewChild('timeline', { read: ElementRef })
  timeline_ref: ElementRef;

  @Input() groups = [];
  @Input() images = [];


  @Output() eventClicked = new EventEmitter<String>();
  @Output() eventUpdate = new EventEmitter<String>();
  @Output() eventDiselected = new EventEmitter();
  @Output() eventAdded = new EventEmitter<EventItem>();

  drawStats = { windowSize: 0, days: 0, start: '', end: '' };
  currentRange;

  //patch, use the on new event to fill htis data, then use
  //double click event, if blank make new item, with this data
  temp_event;  

  vis_timeline = null;
  vis_options = {
    editable: {
      add: true,
      updateTime: false,
      updateGroup: false,
      remove: true
    },   // default for all items
    stack: false,
    stackSubgroups: false,
    clickToUse: false,
    selectable: true, 
    maxHeight: 800, //TODO make window hight the max hight
    minHeight: 200,
    groupOrder: 'content',
    order: this.eventDisplayOrder,
    //zoomMin: 1000 * 60 * 60 * 24,             // one day in milliseconds
    //zoomMax: 1000 * 60 * 60 * 24 * 365000 * 3, //300 thousand years
    onAdd: (item, cb) =>{
      delete item.id;
      this.temp_event = item;
      this.eventAdded.emit(item);
      cb(null);
    },
    onUpdate: this.onUpdate,
    onRemove: item => {
      this.eventUpdate.emit(item.id);
    },

    template: (item, element, data) => {
      // console.log('ITEM', item);
      // console.log('ELEMENT', element);
      // console.log('DATA', data);
      if(item.icon){

        let html = '<div><img  style="vertical-align: middle; padding-right: 2px;"  src=" ';
        html += this.images[item.icon];
        html +='" height="25" width="25"  />';
        html += item.content;
        html += '</div>';
        return html;

      }
    return item.content;
    }
  };

  

  constructor( dataService: DataService, public cdr: ChangeDetectorRef ) { }

  ngAfterViewInit() {
    this.vis_timeline = new timeline.Timeline(this.timeline_ref.nativeElement, 
                                         [], 
                                         this.vis_options);
    this.drawStats.windowSize = this.timeline_ref.nativeElement.offsetHeight;
    this.setup_timeline();

    setTimeout(() => {
      this.vis_timeline.redraw();
      this.vis_timeline.fit();
      this.vis_timeline.zoomIn(0.1);
      this.cdr.detectChanges();
    }, 1000);
    this.redraw();
  }
  
  ngOnDestroy() {
  
  }

  ngOnChanges(changes: {[propKey: string]: SimpleChange}) {
    if(changes['groups']){
      this.redraw(true);
    }
  }

  async redraw(fit = false) {
    const visibleGroups = await this.getVisibleGroups(this.groups);

    let visibleEvents = [];
    for(let i =0;i<visibleGroups.length;i++){
      visibleEvents = await visibleEvents.concat(this.getVisibleGroupEvents(visibleGroups[i]));
    }
    //this.vis_timeline.redraw();
    this.vis_timeline.setGroups(visibleGroups);
    this.vis_timeline.setItems(visibleEvents);

    if(fit){
      this.vis_timeline.fit();
    }

    //this.vis_timeline.redraw();
    this.cdr.detectChanges();
  }

  async getVisibleGroups(groups):Promise<any>{
    let subgroups = [];
    const visible_groups = this.groups
      .map(doc => {
        doc.id = doc._id;
        //see if we have nestedInGroups, if so, make sure they are in display array
        if(doc['_nestedGroups'] && doc._nestedGroups.length !== 0){ //does it have nested groups
          if(doc['showNested']){ //does it suppose to display these groups
            doc.nestedGroups = doc._nestedGroups
              .filter(groupId => groups.find(dd => dd._id === groupId) !== undefined);
          }
          else {
            doc.nestedGroups = [];
            //to later hide these groups, they are invisible
            subgroups = subgroups.concat(doc._nestedGroups);
          }
        }
        else {
          delete doc.nestedGroups;
        }
        return doc;
      })
      //finally filter the groups by invisible subnested ids
      .filter(doc => subgroups.find(id => id === doc.id) === undefined);
      return visible_groups;
  }



  getVisibleGroupEvents(group){
    const visible_events = [];
    const eventSpans = {}; //temp storage for event categories
    let spanLevelIndex = RANGE_LEVELS.findIndex(sl => sl.days < this.drawStats.days);
    spanLevelIndex = (spanLevelIndex !== -1)?spanLevelIndex:RANGE_LEVELS.length;
  
    //loop1
    for(let e = 0;e < group.events.length; e++){
      //console.log('Loop1: ', e, group.events[e]);
      const processed = this.getProcessedEvent(group.events[e], spanLevelIndex);
      //process the event, see if its first or part of span group
      
      if (processed.id.startsWith('LABEL')){
        if(!eventSpans[processed.content]){
          //group doesnt exist lets make a new one
          //we also need to give it a facke id
          processed.group = group.id;
          eventSpans[processed.content] = processed;
        }
        else {
          //lets check if this event dates are wider then group dates

          if(moment(processed.start) < moment(eventSpans[processed.content].start)){
            eventSpans[processed.content].start = processed.start;
          }

          if(eventSpans[processed.content].end){ //make sure we have date first
            if(processed.end && moment(processed.end) > moment(eventSpans[processed.content].end)){
              eventSpans[processed.content].end = processed.end;
            }
          }
          else{
            eventSpans[processed.content].end = processed.end;
          }

          eventSpans[processed.content].title = eventSpans[processed.content].title +
            '<BR>'+processed.title;
          eventSpans[processed.content].counter++;
        }
      }
      else{
        visible_events.push(processed);
      }
        
      
    }

    Object.entries(eventSpans).forEach(([key, val]) => {
      val['content'] = val['content']+'('+val['counter']+')';
      visible_events.push(val);
    });
    return visible_events;
  }
    
  getProcessedEvent(event, index) {
    for(let ii = index; ii< RANGE_LEVELS.length; ii++){
      const content = event[RANGE_LEVELS[ii].type+'Label'];
      if(content){
        //we have it lets make an event based on this
            
        return {
          title: event.content,
          content: content,
          start: event.start,
          end: event.end,
          id: 'LABEL'+event._id,
          group:event.group,
          counter:1
        };            
      }
    }
    return { ...event, ...{id: event._id} };
  }


  //visTimeline internal event listeners
  onAdd = (item, callback) => {
    const newitem = new EventItem({...item, ...{ type: 'box', id: null, _id: null}});
    this.eventAdded.emit(newitem);
    //this.eventService.save(newitem);
    callback(null);
  }

  onUpdate(item, callback){
    this.eventUpdate.emit(item.id);
    callback(null);
  }

  onRemove(item, callback){
    callback(item);
  }

  onResize(event){
    this.drawStats.windowSize = event.target.innerWidth;
    //this.cdr.detectChanges();
  }


  eventDisplayOrder(a, b) {
    return a.content - b.content; // or by priority
  }


  setup_timeline(){
    this.vis_timeline.on('rangechange', props => {
    });

    this.vis_timeline.on('rangechanged', props => {
      const start = moment(props.start);
      const end = moment(props.end);
      const span = moment.duration(end.diff(start));
      this.drawStats.start = start.format('YYYY-MM-DD');
      this.drawStats.end = end.format('YYYY-MM-DD');
      this.drawStats.windowSize = this.timeline_ref.nativeElement.offsetWidth;
      this.drawStats.days = span.asDays();

      //see if span needs to change
      const tempRange = RANGE_LEVELS.find(range => this.drawStats.days > range.days);

      if(this.currentRange !== tempRange.type){
        this.currentRange = tempRange.type;
        this.redraw();//range changed, so lets redraw
      }
      this.cdr.detectChanges();
    });

    document.getElementById('zoomIn').onclick = () => { this.vis_timeline.zoomIn(0.2); };
    document.getElementById('zoomOut').onclick = () => { this.vis_timeline.zoomOut(0.2); };
    document.getElementById('moveLeft').onclick = () => { this.timeline_move(0.2); };
    document.getElementById('moveRight').onclick = () => { this.timeline_move(-0.2); };
    document.getElementById('fitContents').onclick = () => { this.vis_timeline.fit(); };
    // document.getElementById('toggleRollingMode').onclick = () => { this.vis_timeline.toggleRollingMode(); };

    this.redraw();
  }

  onSelectTimelineEvent(props){
    // lets see if we are selecting or de-selecting
    if(props.items.length === 0){
      this.eventDiselected.emit();
    }
    else {
      this.eventClicked.emit(props.items[0]);
    }
  }

  timeline_move(percentage) {
    const range = this.vis_timeline.getWindow();
    const interval = range.end - range.start;

    this.vis_timeline.setWindow({
      start: range.start.valueOf() - interval * percentage,
      end: range.end.valueOf() - interval * percentage
    });
  }

  printStats(){
    const days = this.drawStats.days.toFixed(2);
    const milleniums = (this.drawStats.days/365000).toFixed(1);
    return days+' days, ('+this.currentRange+') '+milleniums+' milleniums';
  }



}
