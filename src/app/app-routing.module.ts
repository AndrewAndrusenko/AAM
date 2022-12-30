/* import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { } */
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RouteGuardService } from './route-guard.service';

const routes: Routes = [
 { path: 'login', component: LoginComponent },
/*   { path: 'login', component: AppLoginComponent }, */
  { 
    path: 'admin', 
    canActivate : [RouteGuardService],
    loadChildren: () => import('./administration/administration.module').then(m => m.AdministrationModule) 
  },
  { 
    path: 'general', 
    canActivate : [RouteGuardService],
    loadChildren: () => import('./general/general.module').then(m => m.GeneralModule) 
  },
  { 
    path: 'manage', 
    canActivate : [RouteGuardService],
    loadChildren: () => import('./management/management.module').then(m => m.ManagementModule) 
  },
  { path: '', redirectTo : 'login', pathMatch:'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }