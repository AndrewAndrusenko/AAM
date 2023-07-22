import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardComponent } from './root-page.component/root-page.component';

const routes: Routes = [
  { path: '', component: DashboardComponent, data: { reuse: true }}
];

@NgModule({
  declarations: [],
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class GeneralRoutingModule { }