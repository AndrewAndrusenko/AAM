import { AfterViewInit, Component,  Input, OnInit, SimpleChanges,  } from '@angular/core';
import { AsyncValidator, AsyncValidatorFn, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AppConfimActionComponent } from '../../alerts/app-confim-action/app-confim-action.component';
import { AppSnackMsgboxComponent } from '../../app-snack-msgbox/app-snack-msgbox.component';
import { MatSnackBar} from '@angular/material/snack-bar';
import { AppInvestmentDataServiceService } from 'src/app/services/app-investment-data.service.service';
import { customAsyncValidators } from 'src/app/services/customAsyncValidators';
import { AppAccountingService } from 'src/app/services/app-accounting.service';
import { bcTransactionType_Ext } from 'src/app/models/accounts-table-model';
import { AppTableAccLedgerAccountsComponent } from '../../tables/app-table-acc-ledger-accounts/app-table-acc-ledger-accounts';
import { AppTableAccAccountsComponent } from '../../tables/app-table-acc-accounts/app-table-acc-accounts';

interface Level {
  value: number;
  viewValue: string;
}
@Component({
  selector: 'app-acc-entry-modify-form',
  templateUrl: './app-acc-entry-modify-form.html',
  styleUrls: ['./app-acc-entry-modify-form.scss'],
})
export class AppAccEntryModifyFormComponent implements OnInit, AfterViewInit {

  public panelOpenState = true;
  public entryModifyForm: FormGroup;
  @Input() action: string;
  dialogRefConfirm: MatDialogRef<AppConfimActionComponent>;
  dialogChoseAccount: MatDialogRef<AppTableAccAccountsComponent>;
  dialogChoseLedger: MatDialogRef<AppTableAccLedgerAccountsComponent>;
  public newV:AsyncValidatorFn
  public title: string;
  public actionType : string;
  public actionToConfim = {'action':'delete_client' ,'isConfirmed': false}
  public AppSnackMsgbox : AppSnackMsgboxComponent
  public data: any;
  selectedValue : string
  public FirstOpenedAccountingDate : Date;
  // formDisabledFields: ['','']
  TransactionTypes: bcTransactionType_Ext[] = [];

  constructor (
    private fb:FormBuilder, 
    private InvestmentDataServiceService:AppInvestmentDataServiceService, 
    private AccountingDataService:AppAccountingService, 
    private dialog: MatDialog, 
    public snack:MatSnackBar
  ) 
  { this.AccountingDataService.GetTransactionType_Ext('',0,'','','bcTransactionType_Ext').subscribe (
    data => this.TransactionTypes=data)
    this.AccountingDataService.GetbLastClosedAccountingDate(null,null,null,null,'GetbLastClosedAccountingDate').subscribe(data => this.FirstOpenedAccountingDate = data[0].FirstOpenedDate)
    
    this.entryModifyForm = this.fb.group ({
      d_transactionType: {value:null, disabled: false},
      t_id: {value:null, disabled: false},
      t_entryDetails:{value:null, disabled: false},
      t_accountId: {value:null, disabled: false}, 
      t_ledgerNoId: {value:null, disabled: false}, 
      t_extTransactionId : {value:null, disabled: false}, 
      t_dataTime: [null, [Validators.required]],  
      t_amountTransaction: [null, [Validators.required, Validators.pattern('[0-9.,]*') ]   ], 
      t_XactTypeCode: {value:null, disabled: false},  
      t_XactTypeCode_Ext: [null, [Validators.required]], 
      d_Debit : {value:null, disabled: false},  
      d_Credit : {value:null, disabled: false},  
      d_ledgerNo: [null, {    validators: [Validators.required], updateOn:'blur' } ], 
      d_accountNo: [null, {    validators: [Validators.required], updateOn:'blur' } ],  
      d_xActTypeCode_ExtName : {value:null, disabled: false}, 
      d_entryDetails: {value:null, disabled: false}, 
      d_closingBalance: {value:null, disabled: false} 
    })
  }
  ngOnInit(): void {
    this.panelOpenState = true;
    this.title = this.action;
    switch (this.action) {
      case 'Create': 
      this.entryModifyForm.patchValue({})
      this.d_transactionType.patchValue ('AL')
      break;
      case 'Create_Example':
        this.title = 'Create';
        this.data['id']=null;
        this.entryModifyForm.patchValue(this.data);
      break;
      default:
        this.entryModifyForm.patchValue(this.data);
      break; 
      }  
      this.dataTime.setValue(new Date(this.data.t_dataTime));
      this.xActTypeCode.setValue(Number(this.data.t_XactTypeCode));
      this.xActTypeCode_Ext.setValue(Number(this.data.t_XactTypeCode_Ext));
      this.amountFormat()
  }
  showdata () {
  }
  ngAfterViewInit(): void {
    this.newV = customAsyncValidators.AccountingOverdraftAccountAsyncValidator (
      this.AccountingDataService, this.accountId ,this.amountTransaction, this.dataTime, this.xActTypeCode.value, this.d_closingBalance
    )
    if (this.d_transactionType.value === 'AL') { 
      console.log('al', 'validator');
      /*   this.accountNo.setAsyncValidators (
        customAsyncValidators.AccountingAccountNoCustomAsyncValidator(this.AccountingDataService, this.accountNo.value));   */
        this.accountNo.setAsyncValidators (this.newV);  
          this.accountNo.updateValueAndValidity();
      
       } else {
        this.accountNo.setAsyncValidators (
        customAsyncValidators .LedgerAccountNoCustomAsyncValidator(this.AccountingDataService, this.ledgerNo.value));  
       }
    this.ledgerNo.setAsyncValidators (
      customAsyncValidators .LedgerAccountNoCustomAsyncValidator(this.AccountingDataService, this.ledgerNo.value) 
    ) 
    
  }
  showAValidator (){
    this.accountNo.updateValueAndValidity();

   console.log('val',this.accountNo.hasError('overdraft'))
  }
  toggleOverdraftValidator () {
    console.log('err', this.accountNo.getError('closingBalance'))
    console.log('this.accountNo.hasAsyncValidator(this.newV)', this.accountNo.hasAsyncValidator(this.newV));
    this.accountNo.hasAsyncValidator(this.newV) ? this.accountNo.removeAsyncValidators (this.newV) : this.accountNo.setAsyncValidators (this.newV) ;
      this.accountNo.updateValueAndValidity();
  }
  selectAccount () {
    this.dialogChoseAccount = this.dialog.open(AppTableAccAccountsComponent ,{minHeight:'600px', minWidth:'1300px', autoFocus: false, maxHeight: '90vh'});
    this.dialogChoseAccount.componentInstance.action = "Select";
    this.dialogChoseAccount.componentInstance.readOnly = true;
    this.dialogChoseAccount.componentInstance.modal_principal_parent.subscribe ((item)=>{
      this.accountId.patchValue(this.dialogChoseAccount.componentInstance.selectedRow['accountId'])
      this.accountNo.patchValue(this.dialogChoseAccount.componentInstance.selectedRow['accountNo'])
      this.dialogChoseAccount.close(); 
    });
  }
  selectLedger (type:string) {
    this.dialogChoseLedger = this.dialog.open(AppTableAccLedgerAccountsComponent ,{minHeight:'600px', minWidth:'1300px', autoFocus: false, maxHeight: '90vh'});
    this.dialogChoseLedger.componentInstance.action = "Select";
    this.dialogChoseLedger.componentInstance.readOnly = true;
    this.dialogChoseLedger.componentInstance.modal_principal_parent.subscribe ((item)=>{
      console.log('it',this.dialogChoseLedger.componentInstance.selectedRow);
      if (type === 'ledger')  {
        this.ledgerId.patchValue(this.dialogChoseLedger.componentInstance.selectedRow['ledgerNoId'])
        this.ledgerNo.patchValue(this.dialogChoseLedger.componentInstance.selectedRow['ledgerNo'])
        console.log('select ledger');
        this.dialogChoseLedger.close()
      } else {
        this.accountId.patchValue(this.dialogChoseLedger.componentInstance.selectedRow['ledgerNoId'])
        this.accountNo.patchValue(this.dialogChoseLedger.componentInstance.selectedRow['ledgerNo'])
        console.log('select account');
        this.dialogChoseLedger.close()
      }
    });
  }
  amountFormat () {
    this.amountTransaction.patchValue (parseFloat(this.amountTransaction.value.replace(/,/g, '')))
    this.amountTransaction.patchValue( new Intl.NumberFormat().format(this.amountTransaction.value))
  }
  updateResultHandler (result :any, action: string) {
    if (result['name']=='error') {
      this.snack.open('Error: ' + result['detail'].split("\n", 1).join(""),'OK',{panelClass: ['snackbar-error']}); 
    } else {
      this.snack.open(action +': ' + result + ' entry','OK',{panelClass: ['snackbar-success'], duration: 3000});
      this.dialog.closeAll();
      this.AccountingDataService.sendReloadEntryList (this.id.value);
    }
    
  }
  updateEntryData (action:string){
    let newDate = new Date(this.dataTime.value)
    let dataForUpdate = Object.assign({},this.entryModifyForm.value);
    dataForUpdate.t_dataTime = newDate.toLocaleDateString();
    dataForUpdate.t_amountTransaction = parseFloat(this.amountTransaction.value.replace(/,/g, ''));

    console.log('dataForUpdate',this.dataTime.value, dataForUpdate);
    switch (action) {
      case 'Create_Example':
      case 'Create':
        if (this.d_transactionType.value === 'AL') { 
         this.AccountingDataService.fcreateEntryAccounting (dataForUpdate).then ((result) => this.updateResultHandler(result,'Created'))
        } else {
         this.AccountingDataService.createLLEntryAccounting (dataForUpdate).then ((result) => this.updateResultHandler(result, 'Created'))
        }
      break;

      case 'Edit':
        if (this.d_transactionType.value === 'AL') { 
          this.AccountingDataService.updateEntryAccountAccounting (dataForUpdate).then ((result) => this.updateResultHandler(result,'Updated'))
         } else {
          this.AccountingDataService.updateLLEntryAccountAccounting (dataForUpdate).then ((result) => this.updateResultHandler(result,'Updated'))
         }
      break;

      case 'Delete':
        this.dialogRefConfirm = this.dialog.open(AppConfimActionComponent, {panelClass: 'custom-modalbox',} );
        this.dialogRefConfirm.componentInstance.actionToConfim = {'action':'Delete Entry' ,'isConfirmed': false}
        this.dialogRefConfirm.afterClosed().subscribe (actionToConfim => {
          console.log('action', actionToConfim)
          if (actionToConfim.isConfirmed===true) {
            if (this.d_transactionType.value === 'AL') { 
              this.AccountingDataService.deleteEntryrAccountAccounting (dataForUpdate.t_id).then ((result) => this.updateResultHandler(result,'Deleted'))
             } else {
              this.AccountingDataService.deleteLLEntryrAccountAccounting (dataForUpdate.t_id).then ((result) => this.updateResultHandler(result,'Deleted'))
             }
         
          }
        })
      break;
    }
    // this.amountFormat()
  }

  get  d_transactionType() {return this.entryModifyForm.get('d_transactionType')}​
  get  accountNo() {return this.entryModifyForm.get('d_accountNo')}​
  get  accountId() {return this.entryModifyForm.get('t_accountId')}​
  get  ledgerNo() {return this.entryModifyForm.get('d_ledgerNo')}​
  get  ledgerId () {return this.entryModifyForm.get('t_ledgerNoId')}​
  get  debit ()   {return this.entryModifyForm.get('d_Debit') } 
  get  credit ()   {return this.entryModifyForm.get('d_Credit') } 
  get  id ()   {return this.entryModifyForm.get('t_id') } 
  get  dataTime ()   {return this.entryModifyForm.get('t_dataTime') } 
  get  entryDetails ()   {return this.entryModifyForm.get('d_entryDetails') } 
  get  amountTransaction ()   {return this.entryModifyForm.get('t_amountTransaction') } 
  get  xActTypeCode_Ext ()   {return this.entryModifyForm.get('t_XactTypeCode_Ext') } 
  get  xActTypeCode ()   {return this.entryModifyForm.get('t_XactTypeCode') } 
  get  d_closingBalance ()   {return this.entryModifyForm.get('d_closingBalance') } 

}
