import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TreeComponent } from './components/tree/tree.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MatTreeModule} from '@angular/material/tree' ;
import {MatIconModule} from '@angular/material/icon'; 
import {CdkMenuModule} from '@angular/cdk/menu';
import {MaterialExampleModule} from '../material.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatNativeDateModule} from '@angular/material/core';
import {HttpClientModule} from '@angular/common/http';
import { AppMenuComponent } from './components/app-menu/app-menu.component';
import { AppTabsComponent } from './components/app-tabs/app-tabs.component';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './general/dashboard/dashboard.component';
import {MatFormFieldModule} from '@angular/material/form-field';
import { AppLoginComponent } from './components/app-login/app-login.component';
import {MatInputModule} from '@angular/material/input'; 
import {ScrollingModule} from '@angular/cdk/scrolling';
import { DataTablesModule } from "angular-datatables";
import { MatDialogModule} from "@angular/material/dialog";
import { AppClientFormComponent } from './components/forms/app-client-form/app-client-form.component';
import { AppNewAccountComponent } from './components/forms/app-new-account/app-new-account.component';
import { AppConfimActionComponent } from './components/alerts/app-confim-action/app-confim-action.component';
import { AppSnackMsgboxComponent } from './components/app-snack-msgbox/app-snack-msgbox.component';
import { TableAccounts } from './components/tables/app-table-accout/app-table-accout.component';
import { tradesDataTable } from './components/tables/app-table-trades/app-table-trades.component';
import { AppInstrumentTableComponent } from './components/tables/app-table-instrument/app-table-instrument.component';
import { AppInstrumentEditFormComponent } from './components/forms/app-instrument-edit-form/app-instrument-edit-form.component';
import { AppClientsTableComponent } from './components/tables/app-table-clients/app-table-clients.component';
import {MatSlideToggle, MatSlideToggleModule} from '@angular/material/slide-toggle';
import { AppTableStrategiesComponentComponent } from './components/tables/app-table-strategies.component/app-table-strategies.component.component'; 
import { AppStrategyFormComponent } from './components/forms/app-strategy-form/app-strategy-form.component';
import { AppTableStrategyComponent } from './components/tables/app-table-strategy_structure/app-table-strategy_structure.component';
import { AppStructureStrategyFormComponent } from './components/forms/app-structure-strategy-form/app-structure-strategy-form';
import { AppTableSWIFTsInListsComponent } from './components/tables/app-table-swift-IN-list/app-table-swift-IN-list';
import { AppTableSWIFT950ItemsComponent } from './components/tables/app-table-swift-950-items-process/app-table-swift-950-items-process';
import { AppMT950ItemParsing } from './components/forms/app-MT950ItemsParser-form/app-MT950ItemsParser-form';

@NgModule({
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        MatTreeModule,
        MatIconModule,
        MaterialExampleModule,
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
        AppMT950ItemParsing
    ],
    bootstrap: [AppComponent],
    providers: [],

})
export class AppModule { }
