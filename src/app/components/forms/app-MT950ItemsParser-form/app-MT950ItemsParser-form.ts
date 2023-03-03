import { Component,  Input, OnInit, SimpleChanges,  } from '@angular/core';
import { FormBuilder, FormControl, FormGroup,  ValidationErrors,  Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AppConfimActionComponent } from '../../alerts/app-confim-action/app-confim-action.component';
import { AppSnackMsgboxComponent } from '../../app-snack-msgbox/app-snack-msgbox.component';
import { MatSnackBar} from '@angular/material/snack-bar';
import { bcTransactionType_Ext, StrategiesGlobalData } from 'src/app/models/accounts-table-model';
import { AppInstrumentTableComponent } from '../../tables/app-table-instrument/app-table-instrument.component';
import { AppAccountingService } from 'src/app/services/app-accounting.service';

@Component({
  selector: 'app-MT950ItemsParser-form',
  templateUrl: './app-MT950ItemsParser-form.html',
  styleUrls: ['./app-MT950ItemsParser-form.css'],
})
export class AppMT950ItemParsing  {
  mydate = new Date('2014-04-03'); 
  public swift950Entry=this.fb.group ({
    XactTypeCode_Ext: null,
    amountTransaction: 0,
    dataTime: new Date().toISOString(),
    accountId: null,
    accountNo: null,
    ledgerNoId: null,
    ledgerNo: null,
    entryDetails: null
    })
  @Input() action: string;
  @Input() strategyId: string;
  @Input() MP: boolean;
  dialogRefConfirm: MatDialogRef<AppConfimActionComponent>;
  isEditForm: boolean = false;
  dialogRef: MatDialogRef<AppInstrumentTableComponent>;
  dtOptions: any = {};
  MPnames: StrategiesGlobalData [] = [];
  public fullInstrumentsLists :string [] =[];
  public actionType : string;
  public actionToConfim = {'action':'delete_client' ,'isConfirmed': false}
  public AppSnackMsgbox : AppSnackMsgboxComponent
  public showStrateryStructure: boolean;
  public data: any;
  TransactionTypes: bcTransactionType_Ext[] = [];
  constructor (
    private fb:FormBuilder, 
    private AccountingDataService:AppAccountingService, 
    private dialog: MatDialog, 
    public snack:MatSnackBar,
  ) {
    this.AccountingDataService.getEntryDraft().subscribe (data => {
      console.log('data', data.XactTypeCode_Ext);
      this.swift950Entry.patchValue(data)
      this.swift950Entry.controls.XactTypeCode_Ext.setValue(Number(data.XactTypeCode_Ext))
    })
      
    this.AccountingDataService.GetTransactionType_Ext('',0,'','','bcTransactionType_Ext').subscribe (data => this.TransactionTypes=data)
  }
  
  get  amountTransaction ()   {return this.swift950Entry.get('amountTransaction') } 
  get  XactTypeCode_Ext ()   {return this.swift950Entry.get('XactTypeCode_Ext') } 
  get  dataTime ()   {return this.swift950Entry.get('dataTime') } 
  get  accountId ()   {return this.swift950Entry.get('accountId') } 
  get  ledgerNoId ()   {return this.swift950Entry.get('ledgerNoId') } 
  get  entryDetails ()   {return this.swift950Entry.get('entryDetails') } 

}