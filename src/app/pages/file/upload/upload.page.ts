import { Component, OnInit } from '@angular/core';
import { ModalController, ToastController } from '../../../../../node_modules/@ionic/angular';
import { DataService } from '../../../services/data.service';
import { FileItem, FILE_SERVICE } from '../../../models';
import { StateService } from '../../../services/state.service';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.page.html',
  styleUrls: ['./upload.page.scss'],
})
export class UploadPage implements OnInit {

  uploadFile;
  uploadFileName;

  item = new FileItem();

  constructor(public modalController : ModalController,
              public toastController: ToastController,
              public state: StateService,
              public dataService: DataService) { }

  ngOnInit() {
  }



  async saveImage(){
    //check if we have all data
    if(!this.uploadFile){
      const toast = await this.toastController.create({
        message: 'No image specified',
        duration: 2000
      });
      toast.present();
    }
    else if(!this.item.name){
      const toast = await this.toastController.create({
        message: 'Please input image name',
        duration: 2000
      });
      toast.present();
    }
    else {
      const res = await this.dataService.saveInProject(
        {'name': this.item.name}, 
        this.state.selectedProject,
        FILE_SERVICE, null, this.uploadFile);

      const toast = await this.toastController.create({
          message: 'Image uploaded successfully',
          duration: 2000
      });
      toast.present();
      this.uploadFile = null;
      this.uploadFileName = null;
      this.item.name = null;
      if(res.ok){
        this.modalController.dismiss(res.id);
      }
      else {
        console.log('Issue saving this one', res);
      }

    }
  }



  async processFile(imageInput: any) {
    this.uploadFile = imageInput.files[0];
  }



  close(){
    this.modalController.dismiss();
  }

}
