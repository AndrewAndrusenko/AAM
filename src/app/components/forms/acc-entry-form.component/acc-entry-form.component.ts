import { Component,  EventEmitter,  Input, ViewChild } from '@angular/core';
import { AsyncValidatorFn, FormBuilder, FormGroup, NgForm, ValidationErrors, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { customAsyncValidators } from 'src/app/services/customAsyncValidators.service';
import { AppAccountingService } from 'src/app/services/app-accounting.service';
import { bcTransactionType_Ext, cFormValidationLog } from 'src/app/models/intefaces.model';
import { AppTableAccLedgerAccountsComponent } from '../../tables/acc-accounts-ledger-table.component/acc-accounts-ledger-table.component';
import { AppTableAccAccountsComponent } from '../../tables/acc-accounts-table.component/acc-accounts-table.component';
import { COMMA, ENTER} from '@angular/cdk/keycodes';
import { distinctUntilChanged, filter, Subject, Subscription } from 'rxjs';
import { LogProcessingService } from 'src/app/services/log-processing.service';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { indexDBService } from 'src/app/services/indexDB.service';
@Component({
  selector: 'app-acc-entry-modify-form',
  templateUrl: './acc-entry-form.component.html',
  styleUrls: ['./acc-entry-form.component.scss'],
})
export class AppAccEntryModifyFormComponent {
  @ViewChild('formDirective') private formDirective: NgForm;
  isAccountOverdraft = true;
  public entryModifyForm: FormGroup;
  panelOpenState = true;
  @Input() action: string;
  @Input() Ref: string;
  @Input() swiftID: number;
  dialogChoseAccount: MatDialogRef<AppTableAccAccountsComponent>;
  dialogChoseLedger: MatDialogRef<AppTableAccLedgerAccountsComponent>;
  validatorCorrectAccountNo :AsyncValidatorFn;
  validatorCorrectLedgerAccountNo :AsyncValidatorFn;
  validatorLedgerAccountOverdraft :AsyncValidatorFn;
  validatorLedgerLL2Overdraft :AsyncValidatorFn;
  validatorAccountOverdraft :AsyncValidatorFn;
  validatorCorrectLedgerLLAccountNo: AsyncValidatorFn;
  
  validationsToSkip: string[] = [];
  formSubmitSubject$ = new Subject();
  actionType : string;
  data: any;
  selectedValue : string
  @Input() FirstOpenedAccountingDate : Date;
  TransactionTypes: bcTransactionType_Ext[] = [];
  addOnBlur = true;
  asynValidatorsAdded: boolean = false
  showDraft: boolean = false;
  statusArray: string[] =[]
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  validatorsLogDescription = {
    'd_accountNo':'Account Number',
    'd_ledgerNo':'Ledger Number'
  }
  errorLogAutoProcessing : cFormValidationLog [] = []
  autoProcessingState : boolean = false
  pendingStatusAP: boolean = false
  sbSTPCreateEntry$: Subscription;
  private formStatusChange$: Subscription;
  private accountIDchanges$ :Subscription; 
  private ledgerIDchanges$ :Subscription; 
  private expectedBalance$: Subscription;
  setupDone: boolean = false;
  constructor (
    private fb:FormBuilder, 
    private AccountingDataService:AppAccountingService, 
    private LogService:LogProcessingService,
    private CommonDialogsService:HadlingCommonDialogsService,
    private dialog: MatDialog, 
    private indexDBServiceS:indexDBService,    
  ) 
  {
    this.entryModifyForm = this.fb.group ({
      d_transactionType: {value:0, disabled: false},
      t_id: {value:0, disabled: false},
      t_entryDetails:[null, [Validators.required]],
      t_accountId: {value:null, disabled: false}, 
      t_ledgerNoId: {value:null, disabled: false}, 
      t_extTransactionId : {value:null, disabled: false}, 
      t_dataTime: [null, [Validators.required]],  
      t_amountTransaction: [null, [Validators.required, Validators.pattern('[0-9,]*([0-9.]{0,3})?$') ]   ], 
      t_XactTypeCode: {value:null, disabled: false},  
      t_XactTypeCode_Ext: [null, [Validators.required]], 
      d_Debit : {value:null, disabled: false},  
      d_Credit : {value:null, disabled: false},  
      d_ledgerNo: [null, {validators: [Validators.required], updateOn:'blur' } ], 
      d_accountNo: [null, {validators: [Validators.required], updateOn:'blur' } ],  
      d_xActTypeCode_ExtName : {value:null, disabled: false}, 
      d_closingBalance: {value:null, disabled: false}, 
      d_closingLedgerBalance: {value:null, disabled: false} 
    })    
    this.indexDBServiceS.getIndexDBStaticTables('bcTransactionType_Ext').then (data =>this.TransactionTypes = data['data']);
  }
  async AddAsyncValidators (overdraftOverride:boolean, updateValidators:boolean=false) {
    if (this.FirstOpenedAccountingDate !=null) {
      this.validatorAccountOverdraft = customAsyncValidators.AccountingOverdraftAccountAsyncValidator (this.AccountingDataService, this.accountId ,this.amountTransaction, this.dataTime, this.xActTypeCode, this.d_closingBalance, this.id, this.FirstOpenedAccountingDate);
      this.validatorLedgerAccountOverdraft = customAsyncValidators.AccountingOverdraftLedgerAccountAsyncValidator (this.AccountingDataService, this.ledgerId ,this.amountTransaction, this.dataTime, this.xActTypeCode.getRawValue() === 0? 1: this.xActTypeCode, this.d_closingLedgerBalance, this.id, this.FirstOpenedAccountingDate,this.entryModifyForm );
      this.validatorLedgerLL2Overdraft = customAsyncValidators.AccountingOverdraftLedgerAccountAsyncValidator (this.AccountingDataService, this.accountId ,this.amountTransaction, this.dataTime,  2 , this.d_closingBalance, this.id, this.FirstOpenedAccountingDate,this.entryModifyForm  );
      this.validatorCorrectAccountNo =  customAsyncValidators.AccountingAccountNoAValidator (this.AccountingDataService, this.accountNo.value, this.accountId, this.validationsToSkip); 
      this.validatorCorrectLedgerAccountNo =  customAsyncValidators.LedgerAccountNoAValidator (this.AccountingDataService, this.ledgerNo.value,this.ledgerId, this.validationsToSkip); 
      this.validatorCorrectLedgerLLAccountNo =  customAsyncValidators.LedgerAccountNoAValidator (this.AccountingDataService, this.ledgerNo.value,this.accountId,this.validationsToSkip); 
      if (this.d_transactionType.value === 'AL') { 
        this.accountNo.setAsyncValidators ( overdraftOverride? [this.validatorCorrectAccountNo] : [this.validatorAccountOverdraft, this.validatorCorrectAccountNo]);
        this.ledgerNo.setAsyncValidators (overdraftOverride? [this.validatorCorrectLedgerAccountNo] : [this.validatorLedgerAccountOverdraft, this.validatorCorrectLedgerAccountNo]);
      } else {
        this.accountNo.setAsyncValidators (overdraftOverride?  [this.validatorCorrectLedgerLLAccountNo] : [this.validatorLedgerLL2Overdraft, this.validatorCorrectLedgerLLAccountNo] );
        this.ledgerNo.setAsyncValidators (overdraftOverride? [this.validatorCorrectLedgerAccountNo] : [this.validatorLedgerAccountOverdraft, this.validatorCorrectLedgerAccountNo] );
      }
      updateValidators? this.accountNo.updateValueAndValidity() :null;
      updateValidators? this.ledgerNo.updateValueAndValidity() :null; 
      return console.log('AsyncValidators have been assigned') ;
    }
  }
  formInitialSetup (overdraftOverride:boolean=false,updateValidators:boolean=false) {
    this.entryModifyForm.patchValue(this.data);
    this.xActTypeCode_Ext.setValue(Number(this.data.t_XactTypeCode_Ext))
    this.xActTypeCode.setValue(Number(this.data.t_XactTypeCode))
    this.AddAsyncValidators(overdraftOverride,updateValidators);
    this.amountFormat();
    this.entryModifyForm.markAllAsTouched();
    this.accountIDchanges$ = this.accountId.valueChanges.pipe(distinctUntilChanged()).subscribe(() => (this.amountTransaction.value&&this.dataTime.value)? this.showAValidator('accountNo') : null);
    this.ledgerIDchanges$ = this.ledgerId.valueChanges.pipe(distinctUntilChanged()).subscribe(() => this.amountTransaction.value&&this.dataTime.value? this.showAValidator('ledgerNo'): null)
  }
  clearAsyncValidators (){
    this.ledgerNo.removeAsyncValidators( [this.validatorLedgerAccountOverdraft, this.validatorCorrectLedgerAccountNo]);
    this.ledgerNo.updateValueAndValidity()
    this.accountNo.removeAsyncValidators([this.validatorAccountOverdraft, this.validatorCorrectAccountNo]); 
    this.accountNo.updateValueAndValidity()
  }
  ngOnInit(): void {
    this.Ref? console.log('ngOnInit',this.Ref): null;
    this.sbSTPCreateEntry$ = this.AccountingDataService.getEntryDraft().pipe(filter(entryData => entryData.refTransaction === this.Ref)).subscribe (entryData=> {
      this.setupDone=true
      this.pendingStatusAP=false;
      this.errorLogAutoProcessing=[];
      this.statusArray=[];
      this.action='Create';
      this.accountIDchanges$? this.accountIDchanges$.unsubscribe() :null;
      this.ledgerIDchanges$? this.ledgerIDchanges$.unsubscribe() : null;
      this.clearAsyncValidators()
      let updateValidators = this.data? true : false;
      this.entryModifyForm.reset();
      this.entryModifyForm.markAsPending()
      this.data = entryData.entryDraft
      this.data['t_id'] = 0
      if (entryData.autoProcessing === true) {
        this.autoProcessingState = true;
        this.formStatusChange$=this.entryModifyForm.statusChanges.pipe(distinctUntilChanged()).subscribe(result=>{
          console.log(this.Ref,' formStatusChange',result,this.accountNo.status,this.ledgerNo.status);
          if (result==='PENDING') {
            this.pendingStatusAP = true;
            setTimeout (()=> (<EventEmitter<any>> this.entryModifyForm.statusChanges).emit(this.entryModifyForm.status),500)
          }
          result==='VALID' && this.pendingStatusAP?  this.updateEntryData('Create', false) : null;   
          result==='INVALID' && this.statusArray.length>0 ? this.getFormValidationErrors('full', this.Ref) : null; 
          this.statusArray.push(result)
        })
      };
      this.formInitialSetup(entryData.overRideOverdraft, updateValidators);

    }) 
  }
  ngAfterViewInit(): void {
    this.data? this.formInitialSetup() :null;
  }
  subscriptionsStatus (){
    console.log('ref ',this.Ref,'sbSTPCreateEntry',this.sbSTPCreateEntry$?  this.sbSTPCreateEntry$.closed : this.sbSTPCreateEntry$)
    console.log('ref ',this.Ref,'formStatusChange',this.formStatusChange$?  this.formStatusChange$.closed : this.formStatusChange$)
    console.log('ref ',this.Ref,'accountIDchanges',this.accountIDchanges$?  this.accountIDchanges$.closed : this.accountIDchanges$)
  }
  ngOnDestroy(): void {
    this.Ref? console.log('ngOnDestroy',this.Ref): null;
    this.accountIDchanges$? this.accountIDchanges$.unsubscribe() :null;
    this.ledgerIDchanges$? this.ledgerIDchanges$.unsubscribe() : null;
    this.formStatusChange$? this.formStatusChange$.unsubscribe() : null;
    this.sbSTPCreateEntry$? this.sbSTPCreateEntry$.unsubscribe() : null;
    this.expectedBalance$? this.expectedBalance$.unsubscribe() : null;
  }
  updateExpectedBalance (accountTypeEntryType:string) {
    switch (accountTypeEntryType) {
      case 'accountNoAL':
        this.AccountingDataService.getExpectedBalanceOverdraftCheck (this.accountId.value,this.amountTransaction.value, new Date (this.dataTime.value).toDateString(),this.xActTypeCode.value, this.id.value, new Date (this.FirstOpenedAccountingDate).toDateString(), 'AccountingOverdraftAccountCheck').subscribe(expectBalanceData => this.d_closingBalance.setValue(expectBalanceData[0].closingBalance))
      break;
      case 'accountNoLL':
        this.AccountingDataService.getExpectedBalanceLedgerOverdraftCheck (this.accountId.value,this.amountTransaction.value, new Date (this.dataTime.value).toDateString(), 2 , this.id.value, new Date (this.FirstOpenedAccountingDate).toDateString() ,'AccountingOverdraftAccountCheck').subscribe(expectBalanceData => this.d_closingBalance.setValue(expectBalanceData[0].closingBalance))
      break;
      default:
        this.AccountingDataService.getExpectedBalanceLedgerOverdraftCheck (this.ledgerId.value,this.amountTransaction.value, new Date (this.dataTime.value).toDateString(), this.xActTypeCode.getRawValue() === 0? 1: this.xActTypeCode.getRawValue(), this.id.value, new Date (this.FirstOpenedAccountingDate).toDateString() ,'AccountingOverdraftAccountCheck'). subscribe(expectBalanceData => this.d_closingLedgerBalance.setValue(expectBalanceData[0].closingBalance))
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
        if (this.errorLogAutoProcessing) {
          this.autoProcessingState = false;
          this.formStatusChange$.unsubscribe()
          this.LogService.sendLogObject(this.errorLogAutoProcessing);
        };
        }
    });
  }
  showAValidator (validateScope:string = 'full'){
    if (['full','ledgerNo'].includes(validateScope)) {
      if (this.ledgerNo.hasAsyncValidator(this.validatorLedgerAccountOverdraft)) {
        this.validationsToSkip.push('LedgerAccountNoAValidator');
        this.ledgerNo.updateValueAndValidity();
      } else {
        this.updateExpectedBalance('ledgerNo')
      };
    }
    if (['full','accountNo'].includes(validateScope)) {
      if (this.accountNo.hasAsyncValidator(this.validatorAccountOverdraft) || this.accountNo.hasAsyncValidator (this.validatorLedgerLL2Overdraft)) {
        this.validationsToSkip.push(this.d_transactionType.value === 'AL'? 'AccountingAccountNoAValidator' : 'LedgerAccountNoAValidator');
        this.accountNo.updateValueAndValidity();
      } else {
        this.updateExpectedBalance('accountNo'+ this.d_transactionType.value)
      };
    }
  }
  toggleOverdraftValidator ( overdraft :any, element: string) {
    if (overdraft.checked)  { 
      if (element === 'd_ledgerNo') {
        this.ledgerNo.removeAsyncValidators(this.validatorLedgerAccountOverdraft);
        this.ledgerNo.setAsyncValidators ([this.validatorLedgerAccountOverdraft, this.validatorCorrectLedgerAccountNo]);
      } else {
        if (this.d_transactionType.value === 'AL') { // Account - Ledger Transaction
          this.accountNo.removeAsyncValidators(this.validatorAccountOverdraft);
          this.accountNo.setAsyncValidators ([this.validatorAccountOverdraft, this.validatorCorrectAccountNo]);
        } else {                                      // Ledger - Ledger Transaction 
          this.accountNo.removeAsyncValidators(this.validatorLedgerLL2Overdraft);
          this.accountNo.setAsyncValidators ([this.validatorLedgerLL2Overdraft, this.validatorCorrectLedgerLLAccountNo]); 
        }
      }
    } else { 
      if (element === 'd_ledgerNo') {
        this.ledgerNo.errors['accountIsNotExist']? delete this.ledgerNo.errors['overdraft'] : this.ledgerNo.setErrors(null);
        this.ledgerNo.removeAsyncValidators(this.validatorLedgerAccountOverdraft);
        this.ledgerNo.setAsyncValidators ([this.validatorCorrectLedgerAccountNo]);
      } else {
        this.accountNo.errors['accountIsNotExist']? delete this.accountNo.errors['overdraft'] : this.accountNo.setErrors(null);
        if (this.d_transactionType.value === 'AL') { // Account - Ledger Transaction
          this.accountNo.removeAsyncValidators(this.validatorAccountOverdraft);
          this.accountNo.setAsyncValidators ([this.validatorCorrectAccountNo]);
        } else {                                     // Ledger - Ledger Transaction 
          this.accountNo.removeAsyncValidators(this.validatorLedgerLL2Overdraft);
          this.accountNo.setAsyncValidators ([this.validatorCorrectLedgerLLAccountNo]);
        }
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
    if (this.amountTransaction.value) {
      this.amountTransaction.patchValue (parseFloat(this.amountTransaction.value.replace(/,/g, '')))
      this.amountTransaction.patchValue( new Intl.NumberFormat().format(this.amountTransaction.value))
    }
  }
  updateResultHandler (result :any, action: string, dataForUpdateLog?:any, reloadEntryList:boolean=true) {
    this.CommonDialogsService.snackResultHandler(result,action)
    if (result['name']==='error') {
      this.CommonDialogsService.snackResultHandler(result)
    } else {
      this.autoProcessingState? this.LogService.sendCreatedLogObject (dataForUpdateLog): null;
      this.CommonDialogsService.snackResultHandler({name:'success', detail: result.length + ' entry'}, action);
      console.log(' !this.autoProcessingState&&this.swiftID?', this.autoProcessingState,this.swiftID)   
      reloadEntryList&&!this.swiftID? this.AccountingDataService.sendReloadEntryList (undefined) : null;     
      !this.autoProcessingState&&this.swiftID? this.AccountingDataService.sendReloadEntryList (this.t_extTransactionId.value) : null;        
    }
  }
  updateEntryData (action:string, reloadEntryList:boolean=true){
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
         this.AccountingDataService.updateEntryAccountAccounting (dataForUpdate,'Create',).subscribe (result => this.updateResultHandler(result,'Created',this.entryModifyForm.value, reloadEntryList))
        } else {
         this.AccountingDataService.updateLLEntryAccountAccounting (dataForUpdate,'Create').subscribe (result => this.updateResultHandler(result, 'Created',this.entryModifyForm.value,reloadEntryList))
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