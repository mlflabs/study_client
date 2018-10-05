import { Component, OnInit, Input } from '@angular/core';
import { EventItem } from '../../models/doc.model';
import { ModalController } from '../../../../node_modules/@ionic/angular';
import { DocService, EVENT_SERVICE } from '../../services/doc.service';

@Component({
  selector: 'app-edit-event',
  templateUrl: './edit-event.page.html',
  styleUrls: ['./edit-event.page.scss'],
})
export class EditEventPage implements OnInit {

  @Input()
  item = new EventItem();

  @Input()
  groups = [];

  message = '';

  view = 'main';

  constructor(public modalController : ModalController,
              public docService: DocService) { }

  ngOnInit() {
    /*if(!this.item.views){
      //  this.items
    }*/
  }

  async onSubmit() {
    console.log('Saving event: ', this.item);
    if(this.item.type === 'range' || this.item.type === 'background'){
      console.log('IS RANGE');
      if(this.item.end){
        console.log('Pass');
      }
      else {
        console.log('Didnt pass');
        this.message = 'Range Type needs an end date.';
        return;
      }
    }

    if(this.item.type === 'box' || this.item.type === 'point'){
      console.log('IS POINT');
      if(!this.item.end){
        console.log('Pass');
      } 
      else {
        console.log('Didnt pass');
        this.message = 'Point or Box date cannot include end date';
        return;
      }
    }

    await this.docService.save(Object.assign({}, { _id: null }, this.item), EVENT_SERVICE);

    this.modalController.dismiss(this.item);
    
    
  }

  async saveAndDuplicate() {
    console.log('SaveAndDuplicate: ', this.item);
    if(this.item.type === 'range' || this.item.type === 'background'){
      console.log('IS RANGE');
      if(this.item.end){
        console.log('Pass');
      }
      else {
        console.log('Didnt pass');
        this.message = 'Range Type needs an end date.';
        return;
      }
    }

    if(this.item.type === 'box' || this.item.type === 'point'){
      console.log('IS POINT');
      if(!this.item.end){
        console.log('Pass');
      } 
      else {
        console.log('Didnt pass');
        this.message = 'Point or Box date cannot include end date';
        return;
      }
    }
    this.message = '';

    this.docService.save(Object.assign({}, { _id: null }, this.item), EVENT_SERVICE);
    this.item = Object.assign({}, this.item, { _id: null, id: null });
  }

  printStatus(){
    if(this.item.id){
      return 'Edit: '+this.item.content;
    }
    else {
      return 'New Event';
    }
  }

}
