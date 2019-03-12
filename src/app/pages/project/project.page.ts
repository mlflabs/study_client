import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DataService } from '../../services/data.service';
import { NavController, ModalController } from '@ionic/angular';
import { ProjectItem } from '../../models';
import { StateService } from '../../services/state.service';
import { ProjectEditPage } from '../project-edit/project-edit.page';

@Component({
  selector: 'app-project',
  templateUrl: './project.page.html',
  styleUrls: ['./project.page.scss'],
})
export class ProjectPage implements OnInit {
  name = '';
  _project;
  private _subscription;
  constructor(public route: ActivatedRoute,
              public navCtr: NavController,
              public modalController : ModalController,
              public state: StateService,
              public dataService: DataService) { }



  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    if(id){
      const project = await this.dataService.getDoc(id);
      
      if(project){
        this.refresh(project);
      }
      else {
        this.navCtr.goBack();
      }
    }
    else {
      //redirect to projects
      this.navCtr.goBack();
    }

    this._subscription = this.dataService.subscribeProjectsChanges()
      .subscribe(project => {
        if(project._id === this._project._id){
          if(!project._deleted){
            this.refresh(project);
          }
          else {
            this.navCtr.navigateRoot('/');
          }
        }
    });

  }

  async refresh(project) {
    this.state.selectedProject = project;
    this.name = project.name;
    this._project = project;
  }


  async edit(){
    const modal = await this.modalController.create({
      component: ProjectEditPage,
      componentProps: { item: this.state.selectedProject}
    });
    const res = await modal.present();
  }

}
