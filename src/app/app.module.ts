import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TreeComponent } from './components/tree/tree.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MatTreeModule} from '@angular/material/tree' ;
import {MatIconModule} from '@angular/material/icon'; 
import {CdkMenuModule} from '@angular/cdk/menu';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatNativeDateModule} from '@angular/material/core';
import {HttpClientModule} from '@angular/common/http';
import { AppMenuComponent } from './components/app-menu/app-menu.component';
import { AppTabsComponent } from './components/app-tabs/app-tabs.component';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './general/dashboard/dashboard.component';
import {MatFormFieldModule as MatFormFieldModule} from '@angular/material/form-field';
import { AppLoginComponent } from './components/app-login/app-login.component';
import {MatInputModule as MatInputModule} from '@angular/material/input'; 
import {ScrollingModule} from '@angular/cdk/scrolling';
import { DataTablesModule } from "angular-datatables";
import { MatDialogModule as MatDialogModule} from "@angular/material/dialog";
import { AppClientFormComponent } from './components/forms/app-client-form/app-client-form.component';
import { AppNewAccountComponent } from './components/forms/app-new-account/app-new-account.component';
import { AppConfimActionComponent } from './components/alerts/app-confim-action/app-confim-action.component';
import { AppSnackMsgboxComponent } from './components/app-snack-msgbox/app-snack-msgbox.component';
import { TableAccounts } from './components/tables/app-table-accout/app-table-accout.component';
import { tradesDataTable } from './components/tables/app-table-trades/app-table-trades.component';
import { AppInstrumentTableComponent } from './components/tables/app-table-instrument/app-table-instrument.component';
import { AppInstrumentEditFormComponent } from './components/forms/app-instrument-edit-form/app-instrument-edit-form.component';
import { AppClientsTableComponent } from './components/tables/app-table-clients/app-table-clients.component';
import {MatSlideToggle as MatSlideToggle, MatSlideToggleModule as MatSlideToggleModule} from '@angular/material/slide-toggle';
import { AppTableStrategiesComponentComponent } from './components/tables/app-table-strategies.component/app-table-strategies.component.component'; 
import { AppStrategyFormComponent } from './components/forms/app-strategy-form/app-strategy-form.component';
import { AppTableStrategyComponent } from './components/tables/app-table-strategy_structure/app-table-strategy_structure.component';
import { AppStructureStrategyFormComponent } from './components/forms/app-structure-strategy-form/app-structure-strategy-form';
import { AppTableSWIFTsInListsComponent } from './components/tables/app-table-swift-IN-list/app-table-swift-IN-list';
import { AppTableSWIFT950ItemsComponent } from './components/tables/app-table-swift-950-items-process/app-table-swift-950-items-process';
import { AppMT950ItemParsing } from './components/forms/app-MT950ItemsParser-form/app-MT950ItemsParser-form';
import { AppTableAccEntriesComponent } from './components/tables/app-table-acc-entries/app-table-acc-entries';
import { AppAccEntryModifyFormComponent } from './components/forms/app-acc-entry-modify-form/app-acc-entry-modify-form';
import { AppTableAccAccountsComponent } from './components/tables/app-table-acc-accounts/app-table-acc-accounts';
import { AppTableAccLedgerAccountsComponent } from './components/tables/app-table-acc-ledger-accounts/app-table-acc-ledger-accounts';
import { AppAccAccountModifyFormComponent } from './components/forms/app-acc-account-modify-form/app-acc-account-modify-form ';
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
import { AppTableBalanceSheetComponent } from './components/tables/app-table-balance-sheet/app-table-balance-sheet';
import {MatSortModule} from '@angular/material/sort';
import {MatListModule as MatListModule} from '@angular/material/list';
import { CdkTableModule } from '@angular/cdk/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AppTableMarketDataComponent } from './components/tables/app-table-market-data/app-table-market-data';
import { NgxChartsModule }from '@swimlane/ngx-charts';
import * as echarts from 'echarts';
import { NgxEchartsModule } from 'ngx-echarts';
import { NgEchartExm1Component } from './components/charts/ng-echart-exm1/ng-echart-exm1.component';


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
          })
    ],
    declarations: [
        AppComponent,
        LoginComponent,
        DashboardComponent,
        TreeComponent,
        AppMenuComponent,
        AppTabsComponent,
        AppLoginComponent,
        TableAccounts,
        tradesDataTable,
        AppInstrumentTableComponent,
        AppInstrumentEditFormComponent,
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
        NgEchartExm1Component
    ],
    bootstrap: [AppComponent],
    providers: [ {provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: {strict: true}} ],

})
export class AppModule { }
