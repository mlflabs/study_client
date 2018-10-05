import { Component, OnInit, OnDestroy } from '@angular/core';
import { DocService, DOC_CHANGES_STREM } from '../../../services/doc.service';

@Component({
  selector: 'app-orm',
  templateUrl: './orm.page.html',
  styleUrls: ['./orm.page.scss'],
})
export class OrmPage implements OnInit, OnDestroy {

  public items = [];
  test = {};

  public item = {
    type:'',
    body: '',
    text: '',

  };
  subscriptions = [];

  constructor( public docService: DocService) { }

  async ngOnInit() {
    console.log('ngOnInit');
    this.subscriptions[0] = this.docService.subscribeChanges('test')
      .subscribe(async doc => {
        console.log('We are making changes to docs', doc);
        this.items = await this.docService.getAllDocs('test');
    });

    this.items = await this.docService.getAllDocs('test');
    
    const changes = await this.docService.getAllDocs(DOC_CHANGES_STREM);
    console.log('CHANGES: ', changes);


  }
  saveItem(){
    console.log('Saving Test: ', this.test);
    this.docService.save(Object.assign({}, this.test), 'test');
    this.test = {};
  }

  removeItem(doc) {
    console.log('Removing: ', doc);
    this.docService.delete(doc, 'test');

  }

  selectedTest(item){
    console.log('Selected Item: ', item);
    this.test = {...{}, ...item};
  }

  ngOnDestroy() {
    console.log('ngOnDestroy');
    this.subscriptions.forEach(sub =>{
      sub.unsubscribe();
    });
  }

  execute(){
    console.log('Execute: ', this.item);
    this.docService.save(JSON.parse(this.item.body), this.item.type);
  }

  dropCollection(){
    this.docService._dropCollection(this.item.type);
  }
}
