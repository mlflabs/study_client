import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuardService } from './auth/auth-guard.service';
import { ImagesPage } from './pages/file/images/images.page';
import { ProjectEditPage } from './pages/project-edit/project-edit.page';
import { SelectImageModalPage } from './pages/file/select-image-modal/select-image-modal.page';
import { DisplayImagePage } from './pages/file/display-image/display-image.page';
import { ProjectsPage } from './pages/projects/projects.page';
import { ProjectPage } from './pages/project/project.page';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'projects',
    pathMatch: 'full'
  },
  {
    path: 'projects',
    redirectTo: 'projects/list',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadChildren: './pages/home/home.module#HomePageModule'
  },
  
  { path: 'login', loadChildren: './auth/pages/login/login.module#LoginPageModule' },
  { path: 'register', loadChildren: './auth/pages/register/register.module#RegisterPageModule' },
  { path: 'forgotPassword', loadChildren: './auth/pages/forgot-password/forgot-password.module#ForgotPasswordPageModule' },

  { path: 'user',
  canActivate: [ AuthGuardService ],
  loadChildren: './auth/pages/user/user.module#UserPageModule' },


  { path: 'admin/orm', 
    canActivate: [ AuthGuardService ],
    loadChildren: './pages/admin/orm/orm.module#OrmPageModule' },
  
  { path: 'groupsSelect', loadChildren: './pages/groups-select/groups-select.module#GroupsSelectPageModule' },
  { path: 'upload', loadChildren: './pages/file/upload/upload.module#UploadPageModule' },
  
  
  { path: 'projects', 
    children: [
      { path: 'list', component: ProjectsPage, },
      { path: 'p/:id',
        children: [
          { path: '',  component: ProjectPage },
          { path: 'timeline', loadChildren: './pages/list/list.module#ListPageModule' },
          { path: 'groups', loadChildren: './pages/groups/groups.module#GroupsPageModule' },
          { path: 'graph', loadChildren: './pages/graph/graph.module#GraphPageModule' },
          { path: 'images', component: ImagesPage},
      ]},
    ] },
  { path: 'projectEdit', component: ProjectEditPage },
  { path: 'selectImageModal', component: SelectImageModalPage},
  { path: 'imageSource', component: DisplayImagePage },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
