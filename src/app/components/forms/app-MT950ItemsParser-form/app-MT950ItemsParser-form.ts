import { Component,  Input, OnInit, SimpleChanges,  } from '@angular/core';
import { FormBuilder, FormControl, FormGroup,  ValidationErrors,  Validators } from '@angular/forms';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { AppConfimActionComponent } from '../../alerts/app-confim-action/app-confim-action.component';
import { AppSnackMsgboxComponent } from '../../app-snack-msgbox/app-snack-msgbox.component';
import { MatSnackBar as MatSnackBar} from '@angular/material/snack-bar';
import { bcTransactionType_Ext } from 'src/app/models/accounts-table-model';
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
    XactTypeCode: null,
    amountTransaction: 0,
    dataTime: new Date().toISOString(),
    accountId: null,
    accountNo: null,
    ledgerNoId: null,
    ledgerNo: null,
    entryDetails: null,
    extTransactionId : null
    })
  @Input() action: string;
  @Input() externalId: number;
  dialogRefConfirm: MatDialogRef<AppConfimActionComponent>;
  isEditForm: boolean = false;
  dialogRef: MatDialogRef<AppInstrumentTableComponent>;
  dtOptions: any = {};
  public actionType : string;
  public actionToConfim = {'action':'delete_client' ,'isConfirmed': false}
  public AppSnackMsgbox : AppSnackMsgboxComponent
  public data: any;
  TransactionTypes: bcTransactionType_Ext[] = [];
  panelOpenState: boolean = false;
  constructor (
    private fb:FormBuilder, 
    private AccountingDataService:AppAccountingService, 
    private dialog: MatDialog, 
    public snack:MatSnackBar,
  ) {
    this.AccountingDataService.GetTransactionType_Ext('',0,'','','bcTransactionType_Ext').subscribe (data => this.TransactionTypes=data)
  }
  SubmitEntryAccounntingInsertRow () {
    this.ledgerNo.disable();
    this.accountNo.disable();
    this.AccountingDataService.CreateEntryAccountingInsertRow(this.swift950Entry.value).then ((result) => {
      if (result['name']=='error') {
        this.snack.open('Error: ' + result['detail'].split("\n", 1).join(""),'OK',{panelClass: ['snackbar-error']} ) 
      } else {
        this.snack.open('Created: ' + result + ' entry','OK',{panelClass: ['snackbar-success'], duration: 3000})
        this.swift950Entry.disable();
      }
    });
  }

  public get  amountTransaction ()   {return this.swift950Entry.get('amountTransaction') } 
  public get  XactTypeCode_Ext ()   {return this.swift950Entry.get('XactTypeCode_Ext') } 
  public get  XactTypeCode ()   {return this.swift950Entry.get('XactTypeCode') } 
  public get  dataTime ()   {return this.swift950Entry.get('dataTime') } 
  public get  accountId ()   {return this.swift950Entry.get('accountId') } 
  public get  ledgerNoId ()   {return this.swift950Entry.get('ledgerNoId') } 
  public get  entryDetails ()   {return this.swift950Entry.get('entryDetails') } 
  public get  ledgerNo ()   {return this.swift950Entry.get('ledgerNo') } 
  public get  accountNo ()   {return this.swift950Entry.get('accountNo') } 
  public get  extTransactionId ()   {return this.swift950Entry.get('extTransactionId') } 

}