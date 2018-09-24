import { Component, ViewChild, ElementRef, OnInit, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Doc, EventItem } from '../../models/doc.model';
import { EventsService } from '../../services/events.service';
import * as vis from 'vis';
import { GroupsService } from '../../services/groups.service';
import { timeout } from '../../../../node_modules/rxjs/operators';
@Component({
  selector: 'app-list',
  templateUrl: 'list.page.html',
  styleUrls: ['list.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListPage implements OnInit, AfterViewInit {

  @ViewChild('timeline', { read: ElementRef })
  timeline: ElementRef;

  public item: EventItem = new EventItem();
  public editingItem = false;
  public groups = [];
  public items = []; // new vis.DataSet(this.vis_dataset_options);
  public subscription: any;

  vis_timeline = null;

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
    order: this.customOrder,
    // min: new Date(2012, 0, 1),                // lower limit of visible range
    // max: new Date(2013, 0, 1),                // upper limit of visible range
    // zoomMin: 1000 * 60 * 60 * 24,             // one day in milliseconds
    // zoomMax: 1000 * 60 * 60 * 24 * 31 * 3     // about three months in milliseconds
    onAdd: (item, callback) => {
      console.log('Item added: ', item);
      const newitem = new EventItem({...item, ...{id: null, _id: null}});
      this.eventService.save(newitem);
      callback(null);
    },

    onMove: (item, callback) => {
      callback(item);
      /*
      var title = 'Do you really want to move the item to\n' +
          'start: ' + item.start + '\n' +
          'end: ' + item.end + '?';

      prettyConfirm('Move item', title, function (ok) {
        if (ok) {
          callback(item); // send back item as confirmation (can be changed)
        }
        else {
          callback(null); // cancel editing item
        }
      });
      */
    },

    onMoving: (item, callback) => {
      callback(item);
      /*
      if (item.start < min) item.start = min;
      if (item.start > max) item.start = max;
      if (item.end   > max) item.end   = max;

      callback(item); // send back the (possibly) changed item
      */
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
      /*
      prettyConfirm('Remove item', 'Do you really want to remove item ' + item.content + '?', function (ok) {
        if (ok) {
          callback(item); // confirm deletion
        }
        else {
          callback(null); // cancel deletion
        }
      });
      */
    }
  };

  vis_groups = new vis.DataSet([
    { id: 1, content: 'Group 1' },
    { id: 2, content: 'Group 2' }
  ]);

  vis_items = new vis.DataSet([
    { id: 1, type: 'point', content: 'item 1', editable: true, start: '2014-04-20', group: 1, className: 'negative' },
    { id: 2, type: 'point', content: 'item 2', editable: true, start: '2014-04-14', group: 2, className: 'negative' },
    { id: 3, type: 'point', content: 'item 3', editable: true, start: '2014-04-18', group: 1 },
    {
      id: 4, content: 'item 4', type: 'background', editable: true, start: '2014-04-16',
      className: 'negative', end: '2014-04-19',
    },
    {
      id: 5, content: 'item 5', type: 'background', editable: true, start: '2019-04-25',
      end: '2020-04-25', group: 2
    },
    {
      id: 11, content: 'item 1', type: 'background', editable: true, start: '2014-04-20',
      end: '2019-07-25', group: 1
    },
    { id: 12, content: 'item 2', editable: true, start: '2014-04-14', group: 2 },
    { id: 13, content: 'item 3', editable: true, start: '2014-04-18', group: 1 },
    { id: 14, content: 'item 4', editable: true, start: '2014-04-16', end: '2014-04-19' },
    { id: 15, content: 'item 5', editable: true, start: '2019-04-25' },
    { id: 21, content: 'item 1', editable: true, start: '2014-04-20', group: 1 },
    { id: 22, content: 'item 2', editable: true, start: '2014-04-14', group: 2 },
    { id: 23, content: 'item 3', editable: true, start: '2014-04-18' },
    { id: 24, content: 'item 4', editable: true, start: '2014-04-16', end: '2014-04-19', group: 1 },
    { id: 25, content: 'item 5', editable: true, start: '2019-04-25' },
    { id: 36, content: 'item 6', editable: true, start: '2018-10-27', type: 'point' }
  ]);


  prettyConfirm(title, text, callback) {
    /*
    swal({
      title: title,
      text: text,
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: "#DD6B55"
    }, callback);
    */
  }

  prettyPrompt(title, text, inputValue, callback) {
    /*swal({
      title: title,
      text: text,
      type: 'input',
      showCancelButton: true,
      inputValue: inputValue
    }, callback);
    */
  }

  constructor(public eventService: EventsService,
    public groupService: GroupsService,
    public cdr: ChangeDetectorRef) {

  }

  ngAfterViewInit(): void {

    console.log(this.timeline.nativeElement.textContent);
    this.vis_timeline = new vis.Timeline(this.timeline.nativeElement, this.items, this.vis_options);

    this.vis_timeline.on('rangechange', function (properties) {
      console.log('rangechange', properties);
    });

    this.vis_timeline.on('rangechanged', function (properties) {
      console.log('rangechanged', properties);
    });

    // when we select item in timeline, lets make it the editable item
    this.vis_timeline.on('select', (properties) => {
      // lets see if we are selecting or de-selecting
      if(properties.items.length === 0){
        this.editingItem = false;
      }
      else {
        this.editingItem = true;
        const i = this.items.find(doc => doc._id === properties.items[0]);
        this.item = Object.assign({}, i);
        console.log('selected this.item: ', this.item);
        this.cdr.detectChanges();
      }
    });

    this.vis_timeline.on('itemover', function (properties) {
      console.log('itemover', properties);
      console.log(properties.item);
    });

    this.vis_timeline.on('itemout', function (properties) {
      console.log('itemout', properties);
      console.log('none');
    });

    this.vis_timeline.on('click', function (properties) {
      console.log('click', properties);
    });

    this.vis_timeline.on('doubleClick', function (properties) {
      console.log('doubleClick', properties);
    });

    this.vis_timeline.on('contextmenu', function (properties) {
      console.log('contextmenu', properties);
    });

    this.vis_timeline.on('mouseDown', function (properties) {
      console.log('mouseDown', properties);
    });

    this.vis_timeline.on('mouseUp', function (properties) {
      console.log('mouseUp', properties);
    });

    document.getElementById('zoomIn').onclick = () => { this.vis_timeline.zoomIn(0.2); };
    document.getElementById('zoomOut').onclick = () => { this.vis_timeline.zoomOut(0.2); };
    document.getElementById('moveLeft').onclick = () => { this.move(0.2); };
    document.getElementById('moveRight').onclick = () => { this.move(-0.2); };
    document.getElementById('fitContents').onclick = () => { this.vis_timeline.fit(); };
    // document.getElementById('toggleRollingMode').onclick = () => { this.vis_timeline.toggleRollingMode(); };

    // other possible events:

    // timeline.on('mouseOver', function (properties) {
    //   logEvent('mouseOver', properties);
    // });

    // timeline.on("mouseMove", function(properties) {
    //   logEvent('mouseMove', properties);
    // });

    this.subscription = this.eventService.getDocsObservable().subscribe(
      docs => {
        console.log('event list docs refreshed', docs);
        this.items = (docs);
        this.redraw();
      }
    );

    this.groupService.getDocsObservable().subscribe(
      docs => {
        console.log('Groups:::: ', docs);
        this.groups = docs;
        this.redraw(true);
      }
    );

    this.groupService.loadAllDocs();
    this.eventService.loadAllDocs();
    this.redraw(true);
    this.cdr.detectChanges();

    setTimeout(() => {
      this.redraw(true);
      //this.vis_timeline.redraw();
      //this.vis_timeline.fit();
      this.vis_timeline.zoomIn(0.1);
      this.cdr.detectChanges();
      this.vis_timeline.redraw();
    }, 1000);

    setTimeout(() => {
      this.redraw(true);
      //this.vis_timeline.redraw();
      //this.vis_timeline.fit();
      this.vis_timeline.zoomIn(0.1);
      this.vis_timeline.redraw();
      this.cdr.detectChanges();
    }, 2000);

    setTimeout(() => {
      this.redraw(true);
      //this.vis_timeline.redraw();
      //this.vis_timeline.fit();
      //this.vis_timeline.zoomIn(0.2);
      this.cdr.detectChanges();
    }, 3000);
    setTimeout(() => {
      this.redraw(true);
      //this.vis_timeline.redraw();
      //this.vis_timeline.fit();
      //this.vis_timeline.zoomIn(0.2);
      this.cdr.detectChanges();
    }, 4000);
  }

  onGroupChange(group) {
    console.log('Group Changed: ', group);
    group.visible = !group.visible;
    this.groupService.save(Object.assign({}, group));
  }

  redraw(fit = false) {
      console.log('REDRAWING....');

      // filter which groups are visible
      const visible_groups = this.groups
        .filter(doc => doc.visible)
        .map(doc => {
          doc.id = doc._id;
          return doc;
        });

      // based on visible groups, not filter which events are visible
      const visible_events = this.items
        .filter(item => {
          for (let i = 0; i < visible_groups.length; ++i) {
            if (item.group === visible_groups[i].id) {
              console.log('Success');
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
      console.log('Timeline gettems ', this.vis_timeline.getVisibleItems());
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


  ngOnInit() {
  }

  onSubmit() {
    console.log('Saving event: ', this.item);
    this.eventService.save(Object.assign({}, { _id: null }, this.item));

  }

  removeItem(doc) {
    console.log('Removing event: ', doc);
    this.eventService.remove(doc);

  }

}
