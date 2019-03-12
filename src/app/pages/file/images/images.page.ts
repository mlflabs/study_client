import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { ModalController, ToastController, NavController } from '../../../../../node_modules/@ionic/angular';
import { DataService } from '../../../services/data.service';
import { FILE_SERVICE, FileItem } from '../../../models';
import { UploadPage } from '../upload/upload.page';
import { StateService } from '../../../services/state.service';

@Component({
  selector: 'app-images',
  templateUrl: './images.page.html',
  styleUrls: ['./images.page.scss'],
})
export class ImagesPage implements OnInit {

  @Input()
  image;

  items;
  public subscription: any;


  constructor(public dataService: DataService,
    public modalController: ModalController,
    public toastController: ToastController,
    public navController: NavController,
    public state: StateService,
    public cdr: ChangeDetectorRef) { }

  async ngOnInit() {
    this.refresh();
    /*this.items = docs.map( async item => {
      //item.img = this.dataService.getAttachment()
      const img = this.dataService.getImage(item._id, item.filename);
      return {...item, ...{img: img}};
    });
    */

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

  close(){
    try{
      this.modalController.dismiss();
    }
    catch(e){
      this.navController.goBack();
    } 
    
  }

}
