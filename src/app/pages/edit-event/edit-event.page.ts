import { Component, OnInit, Input } from '@angular/core';
import { EventItem } from '../../models';
import { ModalController, ToastController } from '@ionic/angular';
import { DataService } from '../../services/data.service';
import { EVENT_SERVICE, FileItem, FILE_SERVICE } from '../../models';
import { UploadEvent, UploadFile, FileSystemFileEntry, FileSystemDirectoryEntry } from 'ngx-file-drop';
import { UploadPage } from '../file/upload/upload.page';
import { ImagesPage } from '../file/images/images.page';
import { StateService } from '../../services/state.service';
import { SelectImageModalPage } from '../file/select-image-modal/select-image-modal.page';

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
  imageView = 'images';

  constructor(public modalController : ModalController,
              public toastController: ToastController,
              public state: StateService,
              public dataService: DataService) { }

  ngOnInit() {
    /*if(!this.item.views){
      //  this.items
    }*/
  }

  async onSubmit() {
    if(this.item.type === 'range' || this.item.type === 'background'){
      if(this.item.end){
      }
      else {
        this.message = 'Range Type needs an end date.';
        return;
      }
    }

    if(this.item.type === 'box' || this.item.type === 'point'){
      if(!this.item.end){

      } 
      else {
        this.message = 'Point or Box date cannot include end date';
        return;
      }
    }

    await this.dataService.saveInProject(
      Object.assign({}, { _id: null }, this.item), 
      this.state.selectedProject,
      EVENT_SERVICE);
    this.modalController.dismiss(this.item);
  }

  async saveAndDuplicate() {
    if(this.item.type === 'range' || this.item.type === 'background'){
      if(this.item.end){
      }
      else {
        this.message = 'Range Type needs an end date.';
        return;
      }
    }

    if(this.item.type === 'box' || this.item.type === 'point'){
      if(!this.item.end){
      } 
      else {
        this.message = 'Point or Box date cannot include end date';
        return;
      }
    }
    this.message = '';
    this.dataService.save(Object.assign({}, { _id: null }, this.item), EVENT_SERVICE);
    this.item = Object.assign({}, this.item, { _id: null, id: null, _rev: null });
  }

  delete(){
    this.dataService.remove(this.item.id);
    this.close();
  }

  printStatus(){
    if(this.item.id){
      return 'Edit: '+this.item.content;
    }
    else {
      return 'New Event';
    }
  }

  close(){
    this.modalController.dismiss();
  }

  async newImage(){
    const modal = await this.modalController.create({
      component: UploadPage,
      componentProps: { item: new FileItem}
    });
    const id = await modal.present();
  }

  async selectImage(){
    const modal = await this.modalController.create({
      component: SelectImageModalPage,
    });
    modal.present();
    const res = await modal.onDidDismiss();
    this.item.icon = res.data._id;
  }


}
