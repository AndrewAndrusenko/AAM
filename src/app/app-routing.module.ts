import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuardService } from './services/auth-guard.service';
import { LoginComponent } from './components/main-page/login/login.component';

const routes: Routes = [
 { path: 'login', component: LoginComponent },
  { 
    path: 'general', 
    canActivate : [AuthGuardService ],
    loadChildren: () => import('./components/main-page/general.module').then(m => m.GeneralModule) 
  },
  { path: '', redirectTo : 'login', pathMatch:'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }