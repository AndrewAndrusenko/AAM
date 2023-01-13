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
@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardComponent,
    TreeComponent,
    AppMenuComponent,
    AppTabsComponent,
    
    AppLoginComponent,
    TableAccounts
    
  ],
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
    ScrollingModule
  
  ],

  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
