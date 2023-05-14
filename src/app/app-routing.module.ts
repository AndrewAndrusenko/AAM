import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuardService } from './services/auth-guard.service';
import { LoginComponent } from './components/main-page/login/login.component';
import { DashboardComponent } from './components/main-page/root-page/root-page';
import { InstrumentTabComponent } from './components/main-page/tabs/instrument-tab/instrument-tab.component';
import { StrategiesTabComponent } from './components/main-page/tabs/strateries-tab/strateries-tab';
import { AccAccountsTabComponent } from './components/main-page/tabs/accounting-tab/acc-accounts-tab';
import { AccTransactionsTabComponent } from './components/main-page/tabs/transactions-tab/transactions-tab';
import { PortfoliosTabComponent } from './components/main-page/tabs/portfolios-tab/portfolios-tab';
import { ClientsTabComponent } from './components/main-page/tabs/clients-tab/clients-tab';
export const routesTreeMenu =[
  {
    path: "Instruments",
    data: { reuse: true },
    component: InstrumentTabComponent
  },
  {
    path: "Strategies",
    data: { reuse: true },
    component: StrategiesTabComponent
  },
  {
    path: "Accounts",
    data: { reuse: true },
    component: AccAccountsTabComponent
  },
  {
    path: "Transactions",
    data: { reuse: true },
    component: AccTransactionsTabComponent
  },
  {
    path: "Portfolios",
    data: { reuse: true },
    component: PortfoliosTabComponent
  },
  {
    path: "Clients",
    data: { reuse: true },
    component: ClientsTabComponent
  },
]
export const routes: Routes = [
 { path: 'login', component: LoginComponent },
 { path: 'tree', component: DashboardComponent,  canActivate : [AuthGuardService ], children: routesTreeMenu,  data: { reuse: true } },
 { path: '', redirectTo : 'login', pathMatch:'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }