import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { Doc, GroupItem } from '../../models';
import { DataService } from '../../services/data.service';
import { GROUP_SERVICE } from '../../models';
import { StateService } from '../../services/state.service';


@Component({
  selector: 'app-groups',
  templateUrl: './groups.page.html',
  styleUrls: ['./groups.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GroupsPage implements OnInit, OnDestroy {

  public item: GroupItem = new GroupItem();
  public items = [];
  public isLoading;
  public subscription: any;


  prevUrl='';

  constructor(public dataService: DataService,
              public cdr: ChangeDetectorRef,
              public state: StateService) {

  }

  async ngOnInit() {
    this.prevUrl = this.state.prevUrl;

    this.subscription = this.dataService.subscribeProjectCollectionChanges(
                                this.state.projectId,GROUP_SERVICE)
      .subscribe( docs => {
        this.refresh();
      });
    this.refresh();
    
  }

  async refresh(){
    this.items = await this.dataService.getAllByProjectAndType(
      this.state.projectId, GROUP_SERVICE);
    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  onSubmit() {
    this.dataService.saveInProject(
        Object.assign({}, this.item, { _id: null }), this.state.selectedProject, GROUP_SERVICE);
  }

  removeItem(doc) {
    this.dataService.remove(doc._id);
    //this.groupsService.remove(doc);
  }

}
