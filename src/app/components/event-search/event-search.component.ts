import { Component, OnInit, Input, Output, EventEmitter,} from '@angular/core';
import { DataService } from '../../services/data.service';
import { LASTCHAR, EVENT_SERVICE } from '../../models';
import { StateService } from '../../services/state.service';

@Component({
  selector: 'app-event-search',
  templateUrl: './event-search.component.html',
  styleUrls: ['./event-search.component.scss']
})
export class EventSearchComponent implements OnInit {

  @Input() heading = '';
  @Input() searchTxt = '';
  @Input() searchPlaceholder = 'Search';


  @Output() eventItemSelected = new EventEmitter<String>();


  items = [];

  constructor(public dataService: DataService, 
              public state: StateService) { }

  ngOnInit() {
  }

  onSearchChange(){
    console.log('SearchChange: ', this.searchTxt);
    this.findSearchTerms(this.searchTxt);
    
  }

  searchItemSelected(item){
    console.log('SearchItemSelected: ', item);
    this.eventItemSelected.emit(item);
    this.state.eventItemAdd$.next(item);
  }


  private async  findSearchTerms(value){
    console.log('FindSearchTerms:: ', value);
    //lets find all the search items
    const items  = await this.dataService.getByQuery({
      selector: { 
        $and: [
          { content: {
              $gte: value,
              $lte: value + LASTCHAR
            } 
          },
          {
            _id: {
              $gte: this.state.projectId+ '|' + EVENT_SERVICE,
              $lt: this.state.projectId+ '|' + EVENT_SERVICE+'|'+LASTCHAR
            }
          }
        ]
      },
      limit: 10,
    });
    console.log('Groups: ', this.state.groups);
    this.items = items.map(item => {
      const g = this.state.groups.find(i => i._id === item.group);
      item.group_name = g.content;
      return item;
    });
    console.log('Search Items: ', items);
  }

}
