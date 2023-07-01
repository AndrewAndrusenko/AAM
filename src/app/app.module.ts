import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TreeComponent } from './components/main-page/tree/tree.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MatTreeModule} from '@angular/material/tree' ;
import {MatIconModule} from '@angular/material/icon'; 
import {CdkMenuModule} from '@angular/cdk/menu';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatNativeDateModule} from '@angular/material/core';
import {HttpClientModule} from '@angular/common/http';
import { AppMenuComponent } from './components/main-page/app-menu/app-menu.component';
import { AppTabsComponent } from './components/main-page/app-tabs/app-tabs.component';
import { DashboardComponent } from './components/main-page/root-page/root-page';
import {MatFormFieldModule as MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule as MatInputModule} from '@angular/material/input'; 
import {ScrollingModule} from '@angular/cdk/scrolling';
import { DataTablesModule } from "angular-datatables";
import { MatDialogModule as MatDialogModule} from "@angular/material/dialog";
import { AppClientFormComponent } from './components/forms/client-form/client-form';
import { AppNewAccountComponent } from './components/forms/portfolio-form/portfolio-form';
import { AppConfimActionComponent } from './components/common-forms/app-confim-action/app-confim-action.component';
import { AppSnackMsgboxComponent } from './components/common-forms/app-snack-msgbox/app-snack-msgbox.component';
import { tradesDataTable } from './components/tables/z-ds-trades-table/z-ds-trades-table';
import { AppClientsTableComponent } from './components/tables/clients-table.component/clients-table.component';
import {MatSlideToggle as MatSlideToggle, MatSlideToggleModule as MatSlideToggleModule} from '@angular/material/slide-toggle';
import { AppTableStrategiesComponentComponent } from './components/tables/strategies-table/strategies-table'; 
import { AppStrategyFormComponent } from './components/forms/strategy-form/strategy-form';
import { AppTableStrategyComponent } from './components/tables/strategy_structure-table/strategy_structure-table';
import { AppStructureStrategyFormComponent } from './components/forms/strategy-structure-form/strategy-structure-form';
import { AppTableSWIFTsInListsComponent } from './components/tables/swift-IN-table/swift-IN-table';
import { AppTableSWIFT950ItemsComponent } from './components/tables/swift-950-table/swift-950-table';
import { AppMT950ItemParsing } from './components/forms/SWIFT-MT950Items-form/SWIFT-MT950Items-form';
import { AppTableAccEntriesComponent } from './components/tables/acc-entries-table.component/acc-entries-table.component';
import { AppAccEntryModifyFormComponent } from './components/forms/acc-entry-form/acc-entry-form';
import { AppTableAccAccountsComponent } from './components/tables/acc-accounts-table.component/acc-accounts-table.component';
import { AppTableAccLedgerAccountsComponent } from './components/tables/acc-accounts-ledger-table.component/acc-accounts-ledger-table.component';
import { AppAccAccountModifyFormComponent } from './components/forms/acc-account-form/acc-account-form';
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
import { AppInvInstrumentModifyFormComponent } from './components/forms/instrument-form/instrument-form';
import { AppTableCorporateActionsComponent } from './components/tables/instrument-corp-actions-table/instrument-corp-actions-table';
import { AppTableInstrumentDetailsComponent } from './components/tables/instrument-details-table.component/instrument-details-table.component';
import { AppInvInstrumentDetailsFormComponent } from './components/forms/instrument-details-form/instrument-details-form';
import { TablePortfolios } from './components/tables/portfolios-table/portfolios-table';
import { LoginComponent } from './components/main-page/login/login.component';
import { NgxIndexedDBModule } from 'ngx-indexed-db';
const appInitializerFn = (accessRestirictions:AuthService) => {
    return () => {
        //return accessRestirictions.getAllAccessRestrictions()
        return true
    }
}
@NgModule({
    imports: [
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
        tradesDataTable,
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
        AppMT950ItemParsing,
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
        AccountsTabComponent,
        StrategiesTabComponent,
        AccAccountsTabComponent,
        AccTransactionsTabComponent,
        PortfoliosTabComponent,  
        ClientsTabComponent,
        AppInstrumentCorpActionFormComponent,
        AccSWIFTTabComponent
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
export class AppModule { }import { indexDbConfigAAM } from './models/intefaces';
import { RouteReuseStrategy } from '@angular/router';
import { MaltsevRouteReuseStrategy } from './services/reuse-strategy';
import { InstrumentTabComponent } from './components/main-page/tabs/instrument-tab/instrument-tab.component';
import { AccountsTabComponent } from './component/main-page/tabs/accounts-tab/accounts-tab.component';
import { StrategiesTabComponent } from './components/main-page/tabs/strateries-tab/strateries-tab';
import { AccAccountsTabComponent } from './components/main-page/tabs/accounting-tab/acc-accounts-tab';
import { AccTransactionsTabComponent } from './components/main-page/tabs/transactions-tab/transactions-tab';
import { PortfoliosTabComponent } from './components/main-page/tabs/portfolios-tab/portfolios-tab';
import { ClientsTabComponent } from './components/main-page/tabs/clients-tab/clients-tab';
import { AuthService } from './services/auth.service';
import { AppInstrumentCorpActionFormComponent } from './components/forms/instrument-corp-action-form/instrument-corp-action-form';
import { AccSWIFTTabComponent } from './components/main-page/tabs/SWIFT-tab.component/SWIFT-tab.component';

