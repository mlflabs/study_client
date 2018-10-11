import { Component, ViewChild, ElementRef, 
  OnInit, AfterViewInit, ChangeDetectionStrategy, 
  ChangeDetectorRef, 
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  SimpleChange,
  OnChanges} from '@angular/core';
import { Doc, EventItem, newEdge, RANGE_LEVELS } from '../../models/doc.model';
import * as vis from 'vis';
import * as moment from 'moment';
import { DocService } from '../../services/doc.service';
import { Events } from '../../../../node_modules/@ionic/angular';

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


  @Output() eventClicked = new EventEmitter<String>();
  @Output() eventDoubleClicked = new EventEmitter<String>();
  @Output() eventDiselected = new EventEmitter();
  @Output() eventAdded = new EventEmitter<EventItem>();

  drawStats = {windowSize:0, days: 0, start:'', end:'' };
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
      remove: false
    },   // default for all items
    stack: false,
    stackSubgroups: false,
    clickToUse: false,
    maxHeight: 800, //TODO make window hight the max hight
    minHeight: 200,
    groupOrder: 'content',
    order: this.eventDisplayOrder,
    //zoomMin: 1000 * 60 * 60 * 24,             // one day in milliseconds
    //zoomMax: 1000 * 60 * 60 * 24 * 365000 * 3, //300 thousand years
    onAdd: (item, cb) =>{
      console.log('ON ADD:  ', item);
      delete item.id;
      this.temp_event = item;
      cb(null);
    },
    onUpdate: this.onUpdate,
    onRemove: this.onUpdate,
  };

  

  
  constructor( docService: DocService, public cdr: ChangeDetectorRef ) { }

  ngAfterViewInit() {
    console.log(this.timeline_ref.nativeElement.textContent);
    this.vis_timeline = new vis.Timeline(this.timeline_ref.nativeElement, 
                                         [], 
                                         this.vis_options);
    this.drawStats.windowSize = this.timeline_ref.nativeElement.offsetHeight;
    
    this.setup_timeline();

    setTimeout(() => {

      console.log('1 sec dely');
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
    console.log('OnChanges: ', changes);

    if(changes['groups']){
      console.log('Groups Have Changed');
      this.redraw(true);
    }

    if(changes['currentRange']){
      console.log('%%%%%%%%% Range Changed');
    }
  }

  async redraw(fit = false) {
    console.log('REDRAWING....', this.groups);

    const visibleGroups = await this.getVisibleGroups(this.groups);

    let visibleEvents = [];
    for(let i =0;i<visibleGroups.length;i++){
      visibleEvents = await visibleEvents.concat(this.getVisibleGroupEvents(visibleGroups[i]));
      console.log('visibleGroups->foreach: ', visibleEvents);
    }
    
    console.log('Adding to Timeline: ', visibleGroups, visibleEvents);
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

      console.log('Visible Groups:  ', visible_groups);
      return visible_groups;
  }



  getVisibleGroupEvents(group){
    console.log('GetVisibleGroupEvents: ', group);
    const visible_events = [];
    const eventSpans = {}; //temp storage for event categories
    let spanLevelIndex = RANGE_LEVELS.findIndex(sl => sl.days < this.drawStats.days);
    spanLevelIndex = (spanLevelIndex !== -1)?spanLevelIndex:RANGE_LEVELS.length;
    console.log('Spanlevel index: ', spanLevelIndex);
  
    //loop1
    for(let e = 0;e < group.events.length; e++){
      //console.log('Loop1: ', e, group.events[e]);
      const processed = this.getProcessedEvent(group.events[e], spanLevelIndex);
      //console.log('PROCESSED', processed);
      //process the event, see if its first or part of span group
      if (processed.id.startsWith('LABEL')){
        console.log('Found Label', processed);
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
        //console.log('Pushing to visible_events: ', visible_events);
      }
        
      
    }
    
    //console.log('Found LABELS: ', eventSpans);
    Object.entries(eventSpans).forEach(([key, val]) => {
      val['content'] = val['content']+'('+val['counter']+')';
      visible_events.push(val);
    });

    console.log('Returning visible events:', visible_events);
    return visible_events;
  }
    
  getProcessedEvent(event, index) {
    for(let ii = index; ii< RANGE_LEVELS.length; ii++){
      const content = event[RANGE_LEVELS[ii].type+'Label'];
      //console.log('Contents:', content, event);
      if(content){
        //we have it lets make an event based on this
        //console.log('We have group cat: ', content,  ii);
            
        return {
          title: event.content,
          content: content,
          start: event.start,
          end: event.end,
          id: 'LABEL'+event.id,
          group:event.group,
          counter:1
        };            
      }
    }
    return event;
  }


  //visTimeline internal event listeners
  onAdd = (item, callback) => {
    console.log('onAdd: ', item);
    const newitem = new EventItem({...item, ...{ type: 'box', id: null, _id: null}});
    this.eventAdded.emit(newitem);
    //this.eventService.save(newitem);
    callback(null);
  }

  onUpdate(item, callback){
    console.log('OnUpdate: ', item);
    callback(item);
  }

  onRemove(item, callback){
    console.log('Removing Item: ', item);
    callback(item);
  }

  onResize(event){
    console.log('Window resize: ',event.target.innerWidth, event);
    this.drawStats.windowSize = event.target.innerWidth;
    //this.cdr.detectChanges();
  }


  eventDisplayOrder(a, b) {
    return a.content - b.content; // or by priority
  }


  setup_timeline(){
    this.vis_timeline.on('rangechange', props => {
      //console.log('rangechange', props);
    });

    this.vis_timeline.on('rangechanged', props => {
      console.log('rangechanged', props);
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
        console.log('%%%%%% RANGE CHANGED', this.currentRange);
        this.redraw();//range changed, so lets redraw
      }
      
      this.cdr.detectChanges();
      console.log('Timeline resize data: ', this.drawStats);
    });


    // when we select item in timeline, lets make it the editable item
    this.vis_timeline.on('select', props => {
      //this.onSelectTimelineEvent(props);
    });

    this.vis_timeline.on('itemover', function (properties) {
      //console.log('itemover', properties);
      //console.log(properties.item);
    });

    this.vis_timeline.on('itemout', function (properties) {
      //console.log('itemout', properties);
      //console.log('none');
    });

    this.vis_timeline.on('click', props => {
      console.log('click!!!!!', props);
      if(props.item){
        this.eventClicked.emit(props.item);
      }
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
        this.eventDoubleClicked.emit(props.item);
      }
      else{
        const newitem = new EventItem({...{start: props.time, 
                                           content: 'new',
                                           type: 'box', 
                                           id: null, 
                                           _id: null}});
        this.eventAdded.emit(newitem);
      }
    });

    this.vis_timeline.on('contextmenu', function (properties) {
      //console.log('contextmenu', properties);
    });

    this.vis_timeline.on('mouseDown',  properties => {
      //console.log('mouseDown', properties);
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
          this.redraw();
        } 
      }
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
