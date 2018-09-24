import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit } from '@angular/core';
import { Doc, GroupItem } from '../../models/doc.model';
import { GroupsService } from '../../services/groups.service';

@Component({
  selector: 'app-groups',
  templateUrl: './groups.page.html',
  styleUrls: ['./groups.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GroupsPage implements OnInit {

  public item: GroupItem = new GroupItem();
  public items = [];
  public isLoading;
  public subscription: any;


  constructor(public groupsService: GroupsService,
    public cdr: ChangeDetectorRef) {

  }

  ngOnInit(): void {

    this.subscription = this.groupsService.getDocsObservable().subscribe(
      docs => {
        console.log(docs);
        this.items = docs;
        this.cdr.detectChanges();
      }
    );

    this.groupsService.loadAllDocs();

  }

  onSubmit() {
    console.log('Saving: ', this.item);
    this.groupsService.save(Object.assign({}, this.item, { _id: null }));
  }

  removeItem(doc) {
    console.log('Removing: ', doc);
    this.groupsService.remove(doc);

  }

}
