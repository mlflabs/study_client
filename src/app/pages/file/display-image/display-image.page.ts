import { Component, OnInit } from '@angular/core';
import { DataService } from '../../../services/data.service';

@Component({
  selector: 'app-display-image',
  templateUrl: './display-image.page.html',
  styleUrls: ['./display-image.page.scss'],
})
export class DisplayImagePage implements OnInit {

  constructor(dataService: DataService) { }

  ngOnInit() {
    
  }

}
