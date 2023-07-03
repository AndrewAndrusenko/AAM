import { Component,  Input, OnInit } from '@angular/core';
import { AsyncValidatorFn, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { customAsyncValidators } from 'src/app/services/customAsyncValidators';
import { AppAccountingService } from 'src/app/services/app-accounting.service';
import { bcTransactionType_Ext, cFormValidationLog } from 'src/app/models/intefaces';
import { AppTableAccLedgerAccountsComponent } from '../../tables/acc-accounts-ledger-table.component/acc-accounts-ledger-table.component';
import { AppTableAccAccountsComponent } from '../../tables/acc-accounts-table.component/acc-accounts-table.component';
import { COMMA, ENTER} from '@angular/cdk/keycodes';
import { distinctUntilChanged, filter, Subject, Subscription, tap } from 'rxjs';
import { LogProcessingService } from 'src/app/services/log-processing.service';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
@Component({
  selector: 'app-acc-entry-modify-form',
  templateUrl: './acc-entry-form.html',
  styleUrls: ['./acc-entry-form.scss'],
})
export class AppAccEntryModifyFormComponent implements OnInit {
  isAccountOverdraft = true;
  entryModifyForm: FormGroup;
  panelOpenState = true;
  @Input() action: string;
  @Input() Ref: string;
  dialogChoseAccount: MatDialogRef<AppTableAccAccountsComponent>;
  dialogChoseLedger: MatDialogRef<AppTableAccLedgerAccountsComponent>;
  validatorCorrectAccountNo :AsyncValidatorFn
  validatorCorrectLedgerAccountNo :AsyncValidatorFn
  validatorLedgerAccountOverdraft :AsyncValidatorFn
  validatorLedgerLL2Overdraft :AsyncValidatorFn
  validatorAccountOverdraft :AsyncValidatorFn
  formSubmitSubject$ = new Subject();
  actionType : string;
  data: any;
  selectedValue : string
  FirstOpenedAccountingDate : Date;
  TransactionTypes: bcTransactionType_Ext[] = [];
  addOnBlur = true;
  asynValidatorsAdded: boolean = false
  showDraft: boolean = false;
  statusArray: string[] =[]
  title: string;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  validatorsLogDescription = {
    'd_accountNo':'Account Number',
    'd_ledgerNo':'Ledger Number'
  }
  errorLogAutoProcessing : cFormValidationLog [] = []
  autoProcessingState : boolean = false
  pendingStatusAP: boolean = false
  constructor (
    private fb:FormBuilder, 
    private AccountingDataService:AppAccountingService, 
    private LogService:LogProcessingService,
    private CommonDialogsService:HadlingCommonDialogsService,
    private dialog: MatDialog, 
  ) 
  { this.AccountingDataService.GetTransactionType_Ext('',0,'','','bcTransactionType_Ext').subscribe (
    data => this.TransactionTypes=data)
    this.AccountingDataService.GetbLastClosedAccountingDate(null,null,null,null,'GetbLastClosedAccountingDate').subscribe(data => this.FirstOpenedAccountingDate = data[0].FirstOpenedDate)
    this.entryModifyForm = this.fb.group ({
      d_transactionType: {value:null, disabled: false},
      t_id: {value:0, disabled: false},
      t_entryDetails:{value:null, disabled: false},
      t_accountId: {value:null, disabled: false}, 
      t_ledgerNoId: {value:null, disabled: false}, 
      t_extTransactionId : {value:null, disabled: false}, 
      t_dataTime: [null, [Validators.required]],  
      t_amountTransaction: [0, [Validators.required, Validators.pattern('[0-9,]*([0-9.]{0,3})?$') ]   ], 
      t_XactTypeCode: {value:null, disabled: false},  
      t_XactTypeCode_Ext: [null, [Validators.required]], 
      d_Debit : {value:null, disabled: false},  
      d_Credit : {value:null, disabled: false},  
      d_ledgerNo: [null, {    validators: [Validators.required], updateOn:'blur' } ], 
      d_accountNo: [null, {    validators: [Validators.required], updateOn:'blur' } ],  
      d_xActTypeCode_ExtName : {value:null, disabled: false}, 
      d_closingBalance: {value:null, disabled: false}, 
      d_closingLedgerBalance: {value:null, disabled: false} 
    })
  }

  ngOnInit(): void {
    if (this.FirstOpenedAccountingDate !=null) {
      this.title = this.action;
      this.entryModifyForm.patchValue(this.data);
      this.dataTime.setValue(new Date(this.data.t_dataTime));
      this.xActTypeCode.setValue(Number(this.data.t_XactTypeCode));
      this.xActTypeCode_Ext.setValue(Number(this.data.t_XactTypeCode_Ext));
      this.AddAsyncValidators(false);
      this.amountFormat();
      this.accountId.valueChanges.pipe(
        distinctUntilChanged(),
        tap (data => console.log('id valueChanges', data))
        ).subscribe(() => this.accountNo.updateValueAndValidity());
      this.ledgerId.valueChanges.pipe(
        tap (data => console.log('START id valueChanges', data)),
        distinctUntilChanged(),
        filter(data1=> Number(data1)!==Number(this.ledgerId.value)),
      ).subscribe(() => this.ledgerNo.updateValueAndValidity());
      this.entryModifyForm.markAllAsTouched()
    }
    this.AccountingDataService.getEntryDraft().subscribe ( entryData => {
      if (entryData.refTransaction === this.Ref ) {
        if (entryData.autoProcessing === true) {
          this.autoProcessingState = true;
          this.entryModifyForm.statusChanges.pipe(distinctUntilChanged()).subscribe( (result ) => {
            if (result==='PENDING') {
              console.log('IF PENDING');
              this.pendingStatusAP = true;
              this.accountNo.updateValueAndValidity();
            }
            result==='VALID'&&this.pendingStatusAP? this.updateEntryData('Create') : null;
            result==='INVALID'&&this.statusArray.length>0? this.getFormValidationErrors('full', this.Ref) : null;
            this.statusArray.push(result)
          })
        }
        this.FirstOpenedAccountingDate = entryData.entryDraft.FirstOpenedAccountingDate
        this.entryModifyForm.patchValue(entryData.entryDraft);
        this.id.setValue(0);
        this.dataTime.setValue(new Date(entryData.entryDraft.t_dataTime));
        this.xActTypeCode.setValue(Number(entryData.entryDraft.t_XactTypeCode));
        this.xActTypeCode_Ext.setValue(Number(entryData.entryDraft.t_XactTypeCode_Ext));
        this.action = 'Create'
        this.title = 'Create';
        console.log('over',entryData.overRideOverdraft);
        this.AddAsyncValidators(entryData.overRideOverdraft)
        this.amountFormat()
      }
    })
  }
  async AddAsyncValidators (overdraftOverride:boolean) {
    if (this.FirstOpenedAccountingDate !=null) {
      this.validatorAccountOverdraft = customAsyncValidators.AccountingOverdraftAccountAsyncValidator (this.AccountingDataService, this.accountId ,this.amountTransaction, this.dataTime, this.xActTypeCode, this.d_closingBalance, this.id, this.FirstOpenedAccountingDate,this.entryModifyForm );
      this.validatorCorrectAccountNo =  customAsyncValidators.AccountingAccountNoCustomAsyncValidator (this.AccountingDataService, this.accountNo.value, this.accountId, this.entryModifyForm); 
      this.validatorLedgerAccountOverdraft = customAsyncValidators.AccountingOverdraftLedgerAccountAsyncValidator (this.AccountingDataService, this.ledgerId ,this.amountTransaction, this.dataTime, this.xActTypeCode.getRawValue() === 0? 1: this.xActTypeCode.getRawValue(), this.d_closingLedgerBalance, this.id, this.FirstOpenedAccountingDate,this.entryModifyForm );
      this.validatorLedgerLL2Overdraft = customAsyncValidators.AccountingOverdraftLedgerAccountAsyncValidator (this.AccountingDataService, this.accountId ,this.amountTransaction, this.dataTime,  2 , this.d_closingBalance, this.id, this.FirstOpenedAccountingDate,this.entryModifyForm  );
      this.validatorCorrectLedgerAccountNo =  customAsyncValidators.LedgerAccountNoCustomAsyncValidator (this.AccountingDataService, this.ledgerNo.value,this.ledgerId); 
      if (this.d_transactionType.value === 'AL') { 
        overdraftOverride === true ?this.accountNo.setAsyncValidators ( [this.validatorCorrectAccountNo]) : this.accountNo.setAsyncValidators ([this.validatorAccountOverdraft, this.validatorCorrectAccountNo]);
        this.ledgerNo.setAsyncValidators (overdraftOverride? [this.validatorCorrectLedgerAccountNo] : [this.validatorLedgerAccountOverdraft, this.validatorCorrectLedgerAccountNo]);
      } else {
        this.accountNo.setAsyncValidators (overdraftOverride?  [this.validatorCorrectLedgerAccountNo] : [this.validatorLedgerLL2Overdraft, this.validatorCorrectLedgerAccountNo] );
        this.ledgerNo.setAsyncValidators (overdraftOverride? [this.validatorCorrectLedgerAccountNo] : [this.validatorLedgerAccountOverdraft, this.validatorCorrectLedgerAccountNo] );
      }
      return console.log('asynValidatorsAdded',this.entryModifyForm.status);
    }
  }
  updateExpectedBalance (accountTypeEntryType:string) {
    console.log('accountTypeEntryType',accountTypeEntryType);
    switch (accountTypeEntryType) {
      case 'accountNoAL':
        this.AccountingDataService.getExpectedBalanceOverdraftCheck (this.accountId.value,this.amountTransaction.getRawValue(), new Date (this.dataTime.value).toDateString(),this.xActTypeCode.value, this.id.value, new Date (this.FirstOpenedAccountingDate).toDateString(), 'AccountingOverdraftAccountCheck').subscribe(expectBalanceData => this.d_closingBalance.setValue(expectBalanceData[0].closingBalance))
      break;
      case 'accountNoLL':
        this.AccountingDataService.getExpectedBalanceLedgerOverdraftCheck (this.accountId.value,this.amountTransaction.getRawValue(), new Date (this.dataTime.value).toDateString(), 2 , this.id.value, new Date (this.FirstOpenedAccountingDate).toDateString() ,'AccountingOverdraftAccountCheck').subscribe(expectBalanceData => this.d_closingBalance.setValue(expectBalanceData[0].closingBalance))
      break;
      default:
        this.AccountingDataService.getExpectedBalanceLedgerOverdraftCheck (this.ledgerId.value,this.amountTransaction.getRawValue(), new Date (this.dataTime.value).toDateString(), this.xActTypeCode.getRawValue() === 0? 1: this.xActTypeCode.getRawValue(), this.id.value, new Date (this.FirstOpenedAccountingDate).toDateString() ,'AccountingOverdraftAccountCheck'). subscribe(expectBalanceData => this.d_closingLedgerBalance.setValue(expectBalanceData[0].closingBalance))
      break;
    }
  } 
  getFormValidationErrors(element: string, refTransaction?:string) {
    Object.keys(this.entryModifyForm.controls).forEach(key => {
      const controlErrors: ValidationErrors = this.entryModifyForm.get(key).errors;
      if (controlErrors != null) {
        Object.keys(controlErrors).forEach(keyError => {
          element=='full'? this.errorLogAutoProcessing.push({
            t_extTransactionId: this.t_extTransactionId.value,
            formReference: refTransaction,
            fieldName: key,
            fieldDescription: this.validatorsLogDescription[key],
            errorMsg:'Key control: ' + this.validatorsLogDescription[key] + ', keyError: ' + keyError + ', err value: '+ controlErrors[keyError],
            kKeyError: keyError,
            errorCode: '_'+refTransaction+key+keyError
          }) : null;
         });
         if (element!=='full') {
            (element == 'd_ledgerNo')?  this.entryModifyForm.get("d_ledgerNo").setErrors(null) : this.entryModifyForm.get("d_accountNo").setErrors(null);
         } else {
          this.errorLogAutoProcessing ? this.LogService.sendLogObject(this.errorLogAutoProcessing): null;
         }
      }
    });
  }
  showAValidator (validateScope:string = 'full'){
    console.log('validateScope',validateScope);
    this.entryModifyForm.markAsPending()
    if (['full','ledgerNo'].includes(validateScope)) {
      this.ledgerNo.hasAsyncValidator(this.validatorLedgerAccountOverdraft)? this.ledgerNo.updateValueAndValidity() : this.updateExpectedBalance('ledgerNo');
    }
    if (['full','accountNo'].includes(validateScope)) {
      console.log("'full'||'accountNo'");
      this.accountNo.hasAsyncValidator(this.validatorAccountOverdraft)? this.accountNo.updateValueAndValidity() : this.updateExpectedBalance('accountNo'+ this.d_transactionType.value);
    }
  }
  toggleOverdraftValidator ( overdraft :any, element: string) {
    if (overdraft.checked)  { 
      console.log('overdraft.checked',overdraft.checked);
      this.getFormValidationErrors(element)
      if (element === 'd_ledgerNo') {
        this.ledgerNo.removeAsyncValidators(this.validatorLedgerAccountOverdraft);
        this.ledgerNo.setAsyncValidators ([this.validatorLedgerAccountOverdraft, this.validatorCorrectLedgerAccountNo]);
        // this.ledgerNo.updateValueAndValidity();
      } else {
        if (this.d_transactionType.value === 'AL') { // Account - Ledger Transaction
          this.accountNo.removeAsyncValidators(this.validatorAccountOverdraft);
          this.accountNo.setAsyncValidators ([this.validatorAccountOverdraft, this.validatorCorrectAccountNo]);
        } else {                                      // Ledger - Ledger Transaction 
          this.accountNo.removeAsyncValidators(this.validatorLedgerLL2Overdraft);
          this.accountNo.setAsyncValidators ([this.validatorLedgerLL2Overdraft, this.validatorCorrectLedgerAccountNo]); 
        }
        this.accountNo.updateValueAndValidity();
      }
    }
    else { 
      this.getFormValidationErrors(element)
      console.log('overdraft NOT checked',overdraft.checked);
      if (element === 'd_ledgerNo') {
        this.ledgerNo.removeAsyncValidators(this.validatorLedgerAccountOverdraft);
        this.ledgerNo.setAsyncValidators ([this.validatorCorrectLedgerAccountNo]);
        this.ledgerNo.updateValueAndValidity();
      } else {
        if (this.d_transactionType.value === 'AL') { // Account - Ledger Transaction
          this.accountNo.removeAsyncValidators(this.validatorAccountOverdraft);
          this.accountNo.setAsyncValidators ([this.validatorCorrectAccountNo]);
        } else {                                     // Ledger - Ledger Transaction 
          this.accountNo.removeAsyncValidators(this.validatorLedgerLL2Overdraft);
          this.accountNo.setAsyncValidators ([this.validatorCorrectLedgerAccountNo]);
        }
        this.accountNo.updateValueAndValidity();
      }
    }
    overdraft.checked? this.showAValidator(element.substring(2)):null;
  }
  selectAccount () {
    this.dialogChoseAccount = this.dialog.open(AppTableAccAccountsComponent ,{minHeight:'600px', minWidth:'1600px', autoFocus: false, maxHeight: '90vh'});
    this.dialogChoseAccount.componentInstance.readOnly = true;
    this.dialogChoseAccount.componentInstance.modal_principal_parent.subscribe ((item)=>{
      this.accountId.patchValue(this.dialogChoseAccount.componentInstance.selectedRow['accountId'])
      this.accountNo.patchValue(this.dialogChoseAccount.componentInstance.selectedRow['accountNo'])
      this.dialogChoseAccount.close(); 
    });
  }
  selectLedger (type:string) {
    this.dialogChoseLedger = this.dialog.open(AppTableAccLedgerAccountsComponent ,{minHeight:'600px', minWidth:'1600px', autoFocus: false, maxHeight: '90vh'});
    this.dialogChoseLedger.componentInstance.readOnly = true;
    this.dialogChoseLedger.componentInstance.modal_principal_parent.subscribe (item =>{
      if (type === 'ledger')  {
        this.ledgerId.patchValue(this.dialogChoseLedger.componentInstance.selectedRow['ledgerNoId'])
        this.ledgerNo.patchValue(this.dialogChoseLedger.componentInstance.selectedRow['ledgerNo'])
        this.dialogChoseLedger.close()
      } else {
        this.accountId.patchValue(this.dialogChoseLedger.componentInstance.selectedRow['ledgerNoId'])
        this.accountNo.patchValue(this.dialogChoseLedger.componentInstance.selectedRow['ledgerNo'])
        this.dialogChoseLedger.close()
      }
    });
  }
  amountFormat () {
    this.amountTransaction.patchValue (parseFloat(this.amountTransaction.value.replace(/,/g, '')))
    this.amountTransaction.patchValue( new Intl.NumberFormat().format(this.amountTransaction.value))
    
  }
  updateResultHandler (result :any, action: string, dataForUpdateLog?:any) {
    this.CommonDialogsService.snackResultHandler(result,action)
    if (result['name']==='error') {
      this.CommonDialogsService.snackResultHandler(result)
    } else {
      this.autoProcessingState? this.LogService.sendCreatedLogObject (dataForUpdateLog): null;
      this.CommonDialogsService.snackResultHandler({name:'success', detail: result.length + ' entry'}, action);
      this.AccountingDataService.sendReloadEntryList (this.id.value);
    }
  }
  updateEntryData (action:string){
    let newDate = new Date(this.dataTime.value)
    let dataForUpdate = {}
    let renameFieldsForLL = [['ledgerNoId','ledgerID_Debit'],['dataTime','dateTime'],['accountId','ledgerID'],['amountTransaction','amount']];
    Object.entries(this.entryModifyForm.value).forEach(([key, value])=>Object.assign(dataForUpdate,{[key.substring(2)]: value}))
    dataForUpdate['dataTime'] = newDate.toLocaleDateString();
    dataForUpdate['amountTransaction'] = parseFloat(this.amountTransaction.value.replace(/,/g, ''));
    this.d_transactionType.value ==='LL'? renameFieldsForLL.forEach(pair => Object.assign(dataForUpdate,{[pair[1]]: dataForUpdate[pair[0]]})) : null;
    switch (action) {
      case 'Create_Example':
      case 'Create':
        if (this.d_transactionType.value === 'AL') { 
         this.AccountingDataService.updateEntryAccountAccounting (dataForUpdate,'Create').subscribe (result => this.updateResultHandler(result,'Created',this.entryModifyForm.value))
        } else {
         this.AccountingDataService.updateLLEntryAccountAccounting (dataForUpdate,'Create').subscribe (result => this.updateResultHandler(result, 'Created',this.entryModifyForm.value))
        }
      break;
      case 'Edit':
        if (this.d_transactionType.value === 'AL') { 
          this.AccountingDataService.updateEntryAccountAccounting (dataForUpdate,'Edit').subscribe (result => this.updateResultHandler(result,'Updated'))
         } else {
          this.AccountingDataService.updateLLEntryAccountAccounting (dataForUpdate,'Edit').subscribe (result => this.updateResultHandler(result,'Updated'))
         }
      break;
      case 'Delete':
        this.CommonDialogsService.confirmDialog('Delete Entry '+ this.id.value).subscribe(action => {
          if (action.isConfirmed===true) {
            if (this.d_transactionType.value === 'AL') { 
              this.AccountingDataService.updateEntryAccountAccounting (dataForUpdate,'Delete').subscribe ((result) => this.updateResultHandler(result,'Deleted'))
            } else {
              this.AccountingDataService.updateLLEntryAccountAccounting (dataForUpdate,'Delete').subscribe ((result) => this.updateResultHandler(result,'Deleted'))
            }
          }
        })
      break;
    }
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
  get  entryDetails ()   {return this.entryModifyForm.get('t_entryDetails') } 
  get  amountTransaction ()   {return this.entryModifyForm.get('t_amountTransaction') } 
  get  xActTypeCode_Ext ()   {return this.entryModifyForm.get('t_XactTypeCode_Ext') } 
  get  xActTypeCode ()   {return this.entryModifyForm.get('t_XactTypeCode') } 
  get  d_closingBalance ()   {return this.entryModifyForm.get('d_closingBalance') } 
  get  d_closingLedgerBalance ()   {return this.entryModifyForm.get('d_closingLedgerBalance') } 
  get  t_extTransactionId ()   {return this.entryModifyForm.get('t_extTransactionId') } 
}