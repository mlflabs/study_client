import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { DataService } from '../../../services/data.service';
import { FILE_SERVICE, FileItem } from '../../../models';
import { UploadPage } from '../upload/upload.page';
import { StateService } from '../../../services/state.service';

@Component({
  selector: 'app-select-image-modal',
  templateUrl: './select-image-modal.page.html',
  styleUrls: ['./select-image-modal.page.scss'],
})
export class SelectImageModalPage implements OnInit {

  @Input()
  image;

  items;
  public subscription: any;


  constructor(public dataService: DataService,
    public modalController: ModalController,
    public toastController: ToastController,
    public state: StateService,
    public cdr: ChangeDetectorRef) { }

  async ngOnInit() {
    this.refresh();
    this.subscription = this.dataService.subscribeProjectCollectionChanges(this.state.projectId,FILE_SERVICE)
      .subscribe(async item => {
        this.refresh();
      });
  }

  async refresh(){
    this.items = await this.dataService.getAllByProjectAndType(
      this.state.projectId,FILE_SERVICE, true);
  }

  printSource(item){
    //  return data:image/png;base64, 
    try{
      const s = 'data:'+item._attachments['file']['content_type']+';base64, ' + item._attachments['file']['data'];
      return s;
    }
    catch(e){
      console.log('Print Source ', e);
      return '';
    }
    
  }

  async newImage(){
    const modal = await this.modalController.create({
      component: UploadPage,
      componentProps: { item: new FileItem }
    });
    const id = await modal.present();
  }

  selectImage(item){
    this.modalController.dismiss(item);
  }

  close(){
      this.modalController.dismiss();
  }

}
