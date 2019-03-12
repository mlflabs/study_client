import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { FileDropModule } from 'ngx-file-drop';
import { IonicModule } from '@ionic/angular';

import { OrmPage } from './orm.page';

const routes: Routes = [
  {
    path: '',
    component: OrmPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FileDropModule,
    RouterModule.forChild(routes)
  ],
  declarations: [OrmPage]
})
export class OrmPageModule {}
