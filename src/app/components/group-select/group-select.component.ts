import { Component, OnInit } from '@angular/core';
import { StateService } from '../../services/state.service';
import { saveIntoArray } from '../../utils';

@Component({
  selector: 'app-group-select',
  templateUrl: './group-select.component.html',
  styleUrls: ['./group-select.component.scss']
})
export class GroupSelectComponent implements OnInit {
  heading = 'Visible Groups';



  constructor(public state: StateService) { }

  ngOnInit() {
  }

  onGroupChange(group){
    console.log('OnGroupChange:: ', group);
    this.state.groups = saveIntoArray(Object.assign(
                  group, 
                  { visible: (group.visible === false || group.visible === null) },
                  { showNested: true }),
                  this.state.groups);
  }

}
