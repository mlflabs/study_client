import { Component, OnInit, Input } from '@angular/core';
import { ProjectItem, PROJECT_SERVICE, PROJECT_INDEX_SERVICE } from '../../models';
import { ModalController, ToastController, AlertController } from '../../../../node_modules/@ionic/angular';
import { DataService } from '../../services/data.service';
import { generateShortCollectionId, generateShortUUID } from '../../utils';
import { AuthService } from '../../auth/auth.service';
import { environment } from '../../../environments/environment';
import { access } from 'fs';

@Component({
  selector: 'app-project-edit',
  templateUrl: './project-edit.page.html',
  styleUrls: ['./project-edit.page.scss'],
})
export class ProjectEditPage implements OnInit {

  @Input()
  item = new ProjectItem();

  constructor(public modalController : ModalController,
    public auth: AuthService,
    public alertController: AlertController,
    public toastController: ToastController,
    public dataService: DataService) { }

  ngOnInit() {
  }

  async onSubmit() {

    //for projects the id is a bit different, so we need to
    //make a custom one
    if(this.item._id){
      await this.dataService.save(this.item);
    }
    else {
      await this.dataService.saveNewProject(this.item);
    }

    this.modalController.dismiss(this.item._id);
  }

  close(){
    this.modalController.dismiss();
  }

  async remove(){
    if(this.item._id){
      const alert = await this.alertController.create({
        header: 'Delete Project: '+ this.item.name,
        // subHeader: 'Subtitle',
        message: 'This will REMOVE this project and all its child items, are you sure?',
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            cssClass: 'secondary',
          }, {
            text: 'Remove',
            cssClass: 'danger',
            handler: async () => {
              await this.dataService.removeProject(this.item);
              this.close();
            }
          }
        ]
      }); 

      await alert.present();
    }
  }

}
