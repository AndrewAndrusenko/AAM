import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuardService } from './services/auth-guard.service';
import { LoginComponent } from './components/main-page/login.component/login.component';
import { DashboardComponent } from './components/main-page/root-page.component/root-page.component';
import { InstrumentTabComponent } from './components/main-page/tabs/instrument-tab/instrument-tab.component';
import { StrategiesTabComponent } from './components/main-page/tabs/strateries-tab/strateries-tab';
import { AccAccountsTabComponent } from './components/main-page/tabs/accounting-tab/acc-accounts-tab';
import { AccTransactionsTabComponent } from './components/main-page/tabs/transactions-tab/transactions-tab';
import { PortfoliosTabComponent } from './components/main-page/tabs/portfolios-tab/portfolios-tab';
import { ClientsTabComponent } from './components/main-page/tabs/clients-tab/clients-tab';
import { AccSWIFTTabComponent } from './components/main-page/tabs/SWIFT-tab.component/SWIFT-tab.component';
import { AppTableSWIFT950ItemsComponent } from './components/tables/swift-950-table.component/swift-items-table.component';
import { OrdersTabComponent } from './components/main-page/tabs/trades-orders-tab/trades-orders-tab';
import { AppTabsComponent } from './components/main-page/tabs.component/tabs.component';
import { AccAccountsFeesTabComponent } from './components/main-page/tabs/accounting-fees-tab/accounting-fees-tab';
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
    path: "tree",
    data: { reuse: true },
    component: AppTabsComponent
  },

  {
    path: "Accounts",
    data: { reuse: true },
    component: AccAccountsTabComponent
  },
  {
    path: "Fees",
    data: { reuse: true },
    component: AccAccountsFeesTabComponent
  },
  {
    path: "Transactions",
    data: { reuse: true },
    component: AccTransactionsTabComponent
  },
  {
    path: "SWIFT",
    data: { reuse: true },
    component: AccSWIFTTabComponent
  },
  {
    path: "SWIFT950",
    data: { reuse: true },
    component: AppTableSWIFT950ItemsComponent
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
  {
    path: "Trades & Orders",
    data: { reuse: true },
    component: OrdersTabComponent
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