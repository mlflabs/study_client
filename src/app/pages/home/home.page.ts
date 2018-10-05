import { Component } from '@angular/core';
import { DocService } from '../../services/doc.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  constructor(docService: DocService){
    docService.subscribeChanges('test').subscribe(doc => {
      console.log('Home: ', doc);
    });
  }

}
