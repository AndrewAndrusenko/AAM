import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { AuthGuardService } from './services/auth-guard.service';

const routes: Routes = [
 { path: 'login', component: LoginComponent },
  { 
    path: 'general', 
    canActivate : [AuthGuardService ],
    loadChildren: () => import('./general/general.module').then(m => m.GeneralModule) 
  },
  { path: '', redirectTo : 'login', pathMatch:'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }