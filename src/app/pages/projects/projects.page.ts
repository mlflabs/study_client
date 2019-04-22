import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { DataService } from '../../services/data.service';
import { PROJECT_SERVICE, ProjectItem, PROJECT_INDEX_SERVICE } from '../../models';
import { ProjectEditPage } from '../project-edit/project-edit.page';
import { ToastController, ModalController, NavController } from '../../../../node_modules/@ionic/angular';
import { StateService } from '../../services/state.service';
import { waitMS } from '../../utils';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.page.html',
  styleUrls: ['./projects.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectsPage implements OnInit, OnDestroy {

  public items = [];
  public item;
  public subscription;
  
  constructor(public dataService: DataService,
              public state: StateService,
              public modalController : ModalController,
              public toastController: ToastController,
              public navCtr: NavController,
              public cdr: ChangeDetectorRef) { }

  async ngOnInit() {
    this.subscription = this.dataService.subscribeProjectsChanges()
      .subscribe(doc => {
        this.refresh();
      });
    
    //make projects null, so we are back to top
    this.state.selectedProject = null;
    
    this.refresh();
    await waitMS(1000);
    this.refresh();
  }

  selectItem(item) {
    console.log('Project Selected: ', item);
    this.navCtr.navigateForward('projects/p/'+item._id);

  }

  async refresh(){
    this.items = await this.dataService.getAllByProjectAndType(PROJECT_SERVICE, PROJECT_INDEX_SERVICE);
    this.cdr.detectChanges();
  }



  async addnew(){
    const modal = await this.modalController.create({
      component: ProjectEditPage,
      componentProps: { item: new ProjectItem }
    });
    const res = await modal.present();
  }

  async edit(item){
    //TODO
  }

  removeItem(doc){
    //TODO: we need to remove all the associated records with this.
    this.dataService.remove(doc._id);
  }

  ngOnDestroy() {
    console.log('Projects OnDestroy');
    this.subscription.unsubscribe();
  }

}
