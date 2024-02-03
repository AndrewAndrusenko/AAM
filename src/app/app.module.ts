import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TreeComponent } from './components/main-page/tree.component/tree-menu.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MatTreeModule} from '@angular/material/tree' ;
import {MatIconModule} from '@angular/material/icon'; 
import {CdkMenuModule} from '@angular/cdk/menu';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatNativeDateModule} from '@angular/material/core';
import {HttpClientModule} from '@angular/common/http';
import { AppMenuComponent } from './components/main-page/menu.component/menu.component';
import { AppTabsComponent } from './components/main-page/tabs.component/tabs.component';
import { DashboardComponent } from './components/main-page/root-page.component/root-page.component';
import {MatFormFieldModule as MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule as MatInputModule} from '@angular/material/input'; 
import {ScrollingModule} from '@angular/cdk/scrolling';
import { DataTablesModule } from "angular-datatables";
import { MatDialogModule as MatDialogModule} from "@angular/material/dialog";
import { AppClientFormComponent } from './components/forms/client-form.component/client-form.component';
import { AppNewAccountComponent } from './components/forms/portfolio-form.component/portfolio-form.component';
import { AppConfimActionComponent } from './components/common-forms/app-confim-action/app-confim-action.component';
import { AppSnackMsgboxComponent } from './components/common-forms/app-snack-msgbox/app-snack-msgbox.component';
import { AppClientsTableComponent } from './components/tables/clients-table.component/clients-table.component';
import {MatSlideToggle as MatSlideToggle, MatSlideToggleModule as MatSlideToggleModule} from '@angular/material/slide-toggle';
import { AppTableStrategiesComponentComponent } from './components/tables/strategies-table.component/strategies-table.component'; 
import { AppStrategyFormComponent } from './components/forms/strategy-form.component/strategy-form.component';
import { AppTableStrategyComponent } from './components/tables/strategy_structure-table.component/strategy_structure-table.component';
import { AppStructureStrategyFormComponent } from './components/forms/strategy-structure-form.component/strategy-structure-form';
import { AppTableSWIFTsInListsComponent } from './components/tables/swifts-incoming-table.component/swifts-incoming-table.component';
import { AppTableSWIFT950ItemsComponent } from './components/tables/swift-950-table.component/swift-items-table.component';
import { AppTableAccEntriesComponent } from './components/tables/acc-entries-table.component/acc-entries-table.component';
import { AppAccEntryModifyFormComponent } from './components/forms/acc-entry-form.component/acc-entry-form.component';
import { AppTableAccAccountsComponent } from './components/tables/acc-accounts-table.component/acc-accounts-table.component';
import { AppTableAccLedgerAccountsComponent } from './components/tables/acc-accounts-ledger-table.component/acc-accounts-ledger-table.component';
import { AppAccAccountModifyFormComponent } from './components/forms/acc-account-form.component/acc-account-form.component';
import {MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MatMomentDateModule } from '@angular/material-moment-adapter';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatTabsModule as MatTabsModule} from '@angular/material/tabs';
import {MatSelectModule as MatSelectModule} from '@angular/material/select';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatCheckboxModule as MatCheckboxModule} from '@angular/material/checkbox';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatTooltipModule as MatTooltipModule} from '@angular/material/tooltip';
import {MatTableModule as MatTableModule} from '@angular/material/table';
import {MatPaginatorModule as MatPaginatorModule} from '@angular/material/paginator';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatAutocompleteModule as MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatMenuModule as MatMenuModule} from '@angular/material/menu';
import {MatSnackBarModule as MatSnackBarModule} from '@angular/material/snack-bar';
import {MatButtonModule as MatButtonModule} from '@angular/material/button';
import {MatChipsModule as MatChipsModule} from '@angular/material/chips';
import { AppTableBalanceSheetComponent } from './components/tables/acc-balance-sheet-table.component/acc-balance-sheet-table.component';
import {MatSortModule} from '@angular/material/sort';
import {MatListModule as MatListModule} from '@angular/material/list';
import {CdkTableModule } from '@angular/cdk/table';
import {MatProgressBarModule } from '@angular/material/progress-bar';
import {AppTableMarketDataComponent } from './components/tables/market-data-table.component/market-data-table.component';
import * as echarts from 'echarts';
import {NgxEchartsModule } from 'ngx-echarts';
import { NgEchartMarketDataCandleComponent } from './components/charts/chart-candle-marketdata/echart-marketdata-candle';
import { AppInstrumentTableComponent } from './components/tables/instrument-table.component/instrument-table.component';
import { AppInvInstrumentModifyFormComponent } from './components/forms/instrument-form.component/instrument-form.component';
import { AppTableCorporateActionsComponent } from './components/tables/instrument-corp-actions-table/instrument-corp-actions-table';
import { AppTradeTableComponent } from './components/tables/trade-table.component/trade-table.component';
import { AppTradeModifyFormComponent } from './components/forms/trade-form.component/trade-form.component';
import { AppTableInstrumentDetailsComponent } from './components/tables/instrument-details-table.component/instrument-details-table.component';
import { AppInvInstrumentDetailsFormComponent } from './components/forms/instrument-details-form.component/instrument-details-form.component';
import { TablePortfolios } from './components/tables/portfolios-table.component/portfolios-table.component';
import { LoginComponent } from './components/main-page/login.component/login.component';
import { NgxIndexedDBModule } from 'ngx-indexed-db';
import { AppOrderTableComponent } from './components/tables/orders-table.component/orders-table.component';
import { OrdersTabComponent } from './components/main-page/tabs/trades-orders-tab/trades-orders-tab';
const appInitializerFn = (accessRestirictions:AuthService) => {
    return () => {
        //return accessRestirictions.getAllAccessRestrictions()
        return true
    }
}
@NgModule({
    imports: [
        DragDropModule,
        BrowserModule,
        BrowserAnimationsModule,
        MatTreeModule,
        MatIconModule,
        FormsModule,
        ReactiveFormsModule,
        MatNativeDateModule,
        HttpClientModule,
        AppRoutingModule,
        MatFormFieldModule,
        MatInputModule,
        CdkMenuModule,
        ScrollingModule,
        DataTablesModule,
        MatDialogModule,
        MatSlideToggleModule,
        MatDatepickerModule,
        MatButtonToggleModule,
        MatTabsModule,
        MatSelectModule,
        MatToolbarModule,
        MatCheckboxModule,
        MatSidenavModule,
        MatTooltipModule,
        MatTableModule,
        MatPaginatorModule,
        MatExpansionModule,
        MatAutocompleteModule,
        MatMenuModule,
        MatSnackBarModule,
        MatButtonModule,
        MatChipsModule,
        MatSortModule,
        MatListModule,
        CdkTableModule,
        MatProgressBarModule,
        MatMomentDateModule,
        NgxEchartsModule.forRoot({
            echarts
          }),
        NgxIndexedDBModule.forRoot(indexDbConfigAAM)
    ],
    declarations: [
        AppComponent,
        DashboardComponent,
        TreeComponent,
        AppMenuComponent,
        AppTabsComponent,
        AppInstrumentTableComponent,
        AppClientsTableComponent,
        AppNewAccountComponent,
        AppClientFormComponent,
        AppConfimActionComponent,
        AppSnackMsgboxComponent,
        AppTableStrategiesComponentComponent,
        AppStrategyFormComponent,
        AppTableStrategyComponent,
        AppStructureStrategyFormComponent,
        AppTableSWIFTsInListsComponent,
        AppTableSWIFT950ItemsComponent,
        AppTableAccEntriesComponent,
        AppAccEntryModifyFormComponent,
        AppTableAccAccountsComponent,
        AppTableAccLedgerAccountsComponent,
        AppAccAccountModifyFormComponent,
        AppTableBalanceSheetComponent,
        AppTableMarketDataComponent,
        NgEchartMarketDataCandleComponent,
        AppInvInstrumentModifyFormComponent,
        AppTableCorporateActionsComponent,
        AppTableInstrumentDetailsComponent,
        AppInvInstrumentDetailsFormComponent,
        TablePortfolios,
        LoginComponent,
        InstrumentTabComponent,
        StrategiesTabComponent,
        AccAccountsTabComponent,
        AccTransactionsTabComponent,
        PortfoliosTabComponent,  
        ClientsTabComponent,
        AppInstrumentCorpActionFormComponent,
        AccSWIFTTabComponent,
        AppTradeTableComponent,
        AppTradeModifyFormComponent,
        AppTableCurrenciesDataComponent,
        AppOrderTableComponent,
        OrdersTabComponent,
        AppallocationTableComponent,
        AppInvGenerateOrdersTable,
        AppaInvPortfolioPositionTableComponent,
        AppaInvPortfolioNpvRoiPerformanceTableComponent,
        AppPerformanceTWROiEchartComponentt,
        AppaInvPortfolioNPVDynamicComponent,
        AppaInvPortfolioRevenueFactorAnalysisTableComponent,
        AppPerformanceRevenueFactorChartComponentt,
        AppaIAccFeesManagementTableComponent,
        AppaIAccFeesProcessingTableComponent,
        AccAccountsFeesTabComponent,
        AppaIAccFeesPerformanceTableComponent,
        AppaIAccFeesPerformanceProcessingTableComponent,
        AppAccFeesSchedulesTableComponent,
        AppaIAccFeesSchedulesTable,
        AppAccFeesMainFormComponent,
        AppAccFeesScheduleFormComponent,
        AppAccFeesPortfoliosWithSchedulesTableComponent,
        AppAccFeesPortfolioScheduleFormComponent,
        AppAccFifoTable
     ],
    bootstrap: [AppComponent],
    providers: [ 
        AuthService,
        {
            provide: APP_INITIALIZER,
            useFactory: appInitializerFn,
            multi: true,
            deps: [AuthService]
        },
        {provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: {strict: true}}, 
        {provide: RouteReuseStrategy, useClass: MaltsevRouteReuseStrategy} 
    ],

})
export class AppModule { }import { indexDbConfigAAM } from './models/interfaces.model';
import { RouteReuseStrategy } from '@angular/router';
import { MaltsevRouteReuseStrategy } from './services/reuse-strategy.service';
import { InstrumentTabComponent } from './components/main-page/tabs/instrument-tab/instrument-tab.component';
import { StrategiesTabComponent } from './components/main-page/tabs/strateries-tab/strateries-tab';
import { AccAccountsTabComponent } from './components/main-page/tabs/accounting-tab/acc-accounts-tab';
import { AccTransactionsTabComponent } from './components/main-page/tabs/transactions-tab/transactions-tab';
import { PortfoliosTabComponent } from './components/main-page/tabs/portfolios-tab/portfolios-tab';
import { ClientsTabComponent } from './components/main-page/tabs/clients-tab/clients-tab';
import { AuthService } from './services/auth.service';
import { AppInstrumentCorpActionFormComponent } from './components/forms/instrument-corp-action-form.component/instrument-corp-action-form.component';
import { AccSWIFTTabComponent } from './components/main-page/tabs/SWIFT-tab.component/SWIFT-tab.component';
import { AppTableCurrenciesDataComponent } from './components/tables/currencies-data-table.component/currencies-data-table.component';
import { AppallocationTableComponent } from './components/tables/allocation-table.component/allocation-table.component';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { AppInvGenerateOrdersTable } from './components/tables/inv-generate-orders-table.component/inv-generate-orders-table.component';
import { AppaInvPortfolioPositionTableComponent } from './components/tables/inv-portfolio-position-table.component/inv-portfolio-position-table.component';
import { AppaInvPortfolioNpvRoiPerformanceTableComponent } from './components/tables/inv-portfolio-npv_roi_performance/inv-portfolio-npv_roi_performance';
import { AppPerformanceTWROiEchartComponentt } from './components/charts/performance-twroi-chart.componentt/performance-twroi-chart.componentt';
import { AppaInvPortfolioNPVDynamicComponent } from './components/tables/inv-portfolio-npv_dynamic/inv-portfolio-npv_dynamic';
import { AppaInvPortfolioRevenueFactorAnalysisTableComponent } from './components/tables/inv-portfolio-revenue-factor-analysis/inv-portfolio-revenue-factor-analysis';
import { AppPerformanceRevenueFactorChartComponentt } from './components/charts/performance-revenue-factor-chart.component/performance-revenue-factor-chart.component';
import { AppaIAccFeesManagementTableComponent } from './components/tables/acc-fees-management-calculation-table.component/acc-fees-management-calculation-table.component';
import { AccAccountsFeesTabComponent } from './components/main-page/tabs/accounting-fees-tab/accounting-fees-tab';
import { AppaIAccFeesProcessingTableComponent } from './components/tables/acc-fees-management-processing-table.component/acc-fees-management-processing-table.component';
import { AppaIAccFeesPerformanceTableComponent } from './components/tables/acc-fees-performance-calculation-table.component/acc-fees-performance-calculation-table.component';
import { AppaIAccFeesPerformanceProcessingTableComponent } from './components/tables/acc-fees-performance-processing-table.component/acc-fees-performance-processing-table.component';
import { AppAccFeesSchedulesTableComponent } from './components/tables/acc-fees-main-table.component/acc-fees-main-table.component';
import { AppaIAccFeesSchedulesTable } from './components/tables/acc-fees-schedules-table.component/acc-fees-schedules-table.component';
import { AppAccFeesMainFormComponent } from './components/forms/acc-fees-main-form.component/acc-fees-main-form.component';
import { AppAccFeesScheduleFormComponent } from './components/forms/acc-fees-schedule-form.component/acc-fees-schedule-form.component';
import { AppAccFeesPortfoliosWithSchedulesTableComponent } from './components/tables/acc-fees-portfolios-with-schedules-table.component/acc-fees-portfolios-with-schedules-table.component';
import { AppAccFeesPortfolioScheduleFormComponent } from './components/forms/acc-fees-portfolio-schedule-form.component/acc-fees-portfolio-schedule-form.component';
import { AppAccFifoTable } from './components/tables/acc-fifo-table.component/acc-fifo-table.component';


