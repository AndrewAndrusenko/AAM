import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TreeComponent } from './components/tree/tree.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MatTreeModule} from '@angular/material/tree' ;
import {MatIconModule} from '@angular/material/icon'; 
import {MatProgressBarModule} from '@angular/material/progress-bar'; 
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
import { TableAccounts } from './components/app-accout-tablee/app-accout-tablee.component';
import { DataTablesModule } from "angular-datatables";
import { tradesDataTable } from './components/app-trades-table/app-trades-table.component';
import { AppInstrumentTableComponent } from './components/app-instrument-table/app-instrument-table.component';
import { AppInstrumentEditFormComponent } from './components/forms/app-instrument-edit-form/app-instrument-edit-form.component';
import { MatDialogModule} from "@angular/material/dialog";
import { AppClientFormComponent } from './components/forms/app-client-form/app-client-form.component';
import { AppClientsTableComponent } from './components/app-clients-table/app-clients-table.component';
import { AppNewAccountComponent } from './components/forms/app-new-account/app-new-account.component';
import { AppConfimActionComponent } from './components/alerts/app-confim-action/app-confim-action.component';
import { AppSnackMsgboxComponent } from './components/app-snack-msgbox/app-snack-msgbox.component';

@NgModule({
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

    ],
    providers: [],
    bootstrap: [AppComponent],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        MatTreeModule,
        MatIconModule,
        MatProgressBarModule,
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
    ]
})
export class AppModule { }
