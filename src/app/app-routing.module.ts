import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuardService } from './services/auth-guard.service';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadChildren: './pages/home/home.module#HomePageModule'
  },
  {
    path: 'list',
    loadChildren: './pages/list/list.module#ListPageModule'
  },
  { path: 'auth/login', loadChildren: './pages/auth/login/login.module#LoginPageModule' },
  { path: 'auth/register', loadChildren: './pages/auth/register/register.module#RegisterPageModule' },

  {
    path: 'private/user',
    canActivate: [ AuthGuardService ],
    loadChildren: './pages/private/user/user.module#UserPageModule'
  },
  { path: 'groups', loadChildren: './pages/groups/groups.module#GroupsPageModule' },
  { path: 'admin/orm', 
    canActivate: [ AuthGuardService ],
    loadChildren: './pages/admin/orm/orm.module#OrmPageModule' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
