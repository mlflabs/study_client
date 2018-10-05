import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { Doc, GroupItem } from '../../models/doc.model';
import { GroupsService } from '../../services/groups.service';
import { DocService, GROUP_SERVICE } from '../../services/doc.service';

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


  constructor(public docService: DocService,
              public cdr: ChangeDetectorRef) {

  }

  async ngOnInit() {

    this.subscription = this.docService.subscribeChanges(GROUP_SERVICE)
      .subscribe( async docs => {
        this.items = await this.docService.getAllDocs(GROUP_SERVICE);
        console.log('Group Refresh: ', this.items);
        this.cdr.detectChanges();
      });
    
    this.items = await this.docService.getAllDocs(GROUP_SERVICE);
    console.log('Group Page: ', this.items);
    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  onSubmit() {
    console.log('Saving: ', this.item);
    this.docService.save(Object.assign({}, this.item, { _id: null }), GROUP_SERVICE);
  }

  removeItem(doc) {
    console.log('Removing: ', doc);
    this.docService.delete(doc, GROUP_SERVICE);
    //this.groupsService.remove(doc);
  }

}
