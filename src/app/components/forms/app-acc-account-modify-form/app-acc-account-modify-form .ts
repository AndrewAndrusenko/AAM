import { AfterViewInit, Component,  EventEmitter,  Input, OnInit, Output, SimpleChanges, ViewChild,  } from '@angular/core';
import { FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { AppConfimActionComponent } from '../../alerts/app-confim-action/app-confim-action.component';
import { AppSnackMsgboxComponent } from '../../app-snack-msgbox/app-snack-msgbox.component';
import { MatSnackBar as MatSnackBar} from '@angular/material/snack-bar';
import { AppInvestmentDataServiceService } from 'src/app/services/app-investment-data.service.service';
import { customAsyncValidators } from 'src/app/services/customAsyncValidators';
import { AppAccountingService } from 'src/app/services/app-accounting.service';
import { bcAccountType_Ext, bcEnityType, bcTransactionType_Ext } from 'src/app/models/accounts-table-model';
import { AppTableAccLedgerAccountsComponent } from '../../tables/app-table-acc-ledger-accounts/app-table-acc-ledger-accounts';
import { AppTableAccAccountsComponent } from '../../tables/app-table-acc-accounts/app-table-acc-accounts';
import { AppClientsTableComponent } from '../../tables/app-table-clients/app-table-clients.component';
import { TableAccounts } from '../../tables/app-table-accout/app-table-accout.component';
import { Subscription } from 'rxjs';
import { MatTabGroup as MatTabGroup } from '@angular/material/tabs';

@Component({
  selector: 'app-acc-account-modify-form',
  templateUrl: './app-acc-account-modify-form.html',
  styleUrls: ['./app-acc-account-modify-form.scss'],
})
export class AppAccAccountModifyFormComponent implements OnInit, AfterViewInit {

  public panelOpenState = true;
  public accountModifyForm: FormGroup;
  public accountLedgerModifyForm: FormGroup;
  @Input() action: string;
  dialogRefConfirm: MatDialogRef<AppConfimActionComponent>;
  dialogChoseAccount: MatDialogRef<TableAccounts>;
  dialogChoseClient: MatDialogRef<AppClientsTableComponent>;
  @Output() public modal_principal_parent = new EventEmitter();
  public title: string;
  public aType:number = null;
  public actionType : string;
  public actionToConfim = {'action':'delete_client' ,'isConfirmed': false}
  public AppSnackMsgbox : AppSnackMsgboxComponent
  public data: any;
  public FirstOpenedAccountingDate : Date
  @ViewChild(MatTabGroup) tabGroup: MatTabGroup;
  EnityTypes: bcEnityType[] = [];
  AccountTypes: bcAccountType_Ext[] = [];
  formDisabledFields: string[] = [];
  formLedgerDisabledFields: string[] = []; 
  private subscriptionName: Subscription
  constructor (
    private fb:FormBuilder, 
    private AccountingDataService:AppAccountingService, 
    private dialog: MatDialog, 
    public snack:MatSnackBar,
  ) 
  { 
     this.AccountingDataService.GetEntityTypeList('',0,'','','bcEnityType').subscribe (
    data => this.EnityTypes=data)
    this.AccountingDataService.GetAccountTypeList('',0,'','','bcAccountType_Ext').subscribe (
      data => this.AccountTypes=data)
    this.formDisabledFields = ['clientId', 'accountId', 'idportfolio']
    this.formLedgerDisabledFields = ['ledgerNoId', 'clientID']
    this.accountModifyForm = this.fb.group ({
      accountNo: [null, {validators: [Validators.required], updateOn:'blur' } ],   
      accountTypeExt:[null, [Validators.required]] ,  
      Information: {value:null, disabled: false},  
      clientId: {value:null, disabled: true},  
      currencyCode: [null, [Validators.required, Validators.pattern('[0-9]*') ]],  
      entityTypeCode: [null, [Validators.required]], 
      accountId: {value:null, disabled: true},
      idportfolio: {value:null, disabled: true},
      d_clientname: {value:null, disabled: true}, 
      d_portfolioCode: {value:null, disabled: true}
    })
    this.accountLedgerModifyForm = this.fb.group ({
      ledgerNoId: {value:null, disabled: true},
      ledgerNo: [null, {validators: [Validators.required], updateOn:'blur' } ],
      name: [null, [Validators.required]], 
      accountTypeID: [null, [Validators.required]],  
      accountId: {value:null, disabled: true},
      currecyCode: [null, [Validators.required, Validators.pattern('[0-9]*') ]],
      externalAccountNo: {value:null, disabled: false}, 
      clientID: [{value:null, disabled: true}, [Validators.required]],   
      entityTypeCode:[null, [Validators.required]], 
      ledgerNoCptyCode: {value:null, disabled: false},  
      ledgerNoTrade: {value:null, disabled: false},
      d_Account_Type: {value:null, disabled: false},
      d_Client: {value:null, disabled: true},
      d_APTypeCodeAccount: {value:null, disabled: false},
      d_APType: {value:null, disabled: true},
    })
  }

  ngOnInit(): void {
    this.title = this.action;
    switch (this.action) {
      case 'Create': 
      break;
      case 'Create_Example':
        this.data['accountId'] = null;
        (this.aType == 1)? this.accountLedgerModifyForm.patchValue(this.data): this.accountModifyForm.patchValue(this.data)
        this.title = 'Create';
      break;
      default :
      console.log('this.data)',this.data);
      (this.aType == 1)? this.accountLedgerModifyForm.patchValue(this.data): this.accountModifyForm.patchValue(this.data)
      break;
    } 
    if (this.action == 'View') {
      this.accountModifyForm.disable();
      this.accountLedgerModifyForm.disable();
    }
  }

  ngAfterViewInit(): void {
    let accType = this.d_APTypeCodeAccount.value == 1 ? 'Active' : 'Passive'
    this.accountLedgerModifyForm.controls['d_APType'].patchValue(accType)

    let accountNoToCheck = (this.action !== 'Create_Example') ? this.accountNo.value : null
    let accountNoToCheckLedger = (this.action !== 'Create_Example') ? this.ledgerNo.value : null
    this.accountNo.setAsyncValidators (
      customAsyncValidators.AccountingUniqueAccountNoAsyncValidator(this.AccountingDataService, accountNoToCheck) 
    )
    this.accountNo.updateValueAndValidity();  
    this.ledgerNo.setAsyncValidators (
      customAsyncValidators.AccountingUniqueLedgerNoAsyncValidator(this.AccountingDataService, accountNoToCheckLedger) 
    )
    this.ledgerNo.updateValueAndValidity();  
  }
  selectPortfolio () {
    this.dialogChoseAccount = this.dialog.open(TableAccounts ,{minHeight:'600px', minWidth:'1300px', autoFocus: false, maxHeight: '90vh'});
    this.dialogChoseAccount.componentInstance.action = "Select";
    this.dialogChoseAccount.componentInstance.readOnly = true;
    this.dialogChoseAccount.componentInstance.clientId = this.clientId.value;
    this.dialogChoseAccount.componentInstance.actionOnAccountTable = "Get_Accounts_By_CientId";
    
    this.dialogChoseAccount.componentInstance.modal_principal_parent.subscribe ((item)=>{
      this.accountModifyForm.controls['idportfolio'].patchValue(this.dialogChoseAccount.componentInstance.selectedRow['idportfolio'])
      this.accountModifyForm.controls['d_portfolioCode'].patchValue(this.dialogChoseAccount.componentInstance.selectedRow['portfolioname'])
      this.dialogChoseAccount.close(); 
    });
  }
  selectClient () {
    this.dialogChoseClient = this.dialog.open(AppClientsTableComponent ,{minHeight:'600px', minWidth:'1300px', autoFocus: false, maxHeight: '90vh'});
    this.dialogChoseClient.componentInstance.action = "Select";
    this.dialogChoseClient.componentInstance.readOnly = true;
    this.dialogChoseClient.componentInstance.modal_principal_parent.subscribe ((item)=>{
      this.accountModifyForm.controls['clientId'].patchValue(this.dialogChoseClient.componentInstance.selectedRow['idclient'])
      this.accountLedgerModifyForm.controls['clientID'].patchValue(this.dialogChoseClient.componentInstance.selectedRow['idclient'])
      this.accountModifyForm.controls['d_clientname'].patchValue(this.dialogChoseClient.componentInstance.selectedRow['clientname'])
      this.accountLedgerModifyForm.controls['d_Client'].patchValue(this.dialogChoseClient.componentInstance.selectedRow['clientname'])
      this.dialogChoseClient.close(); 
    });
  }
  changeAccountType () {
   let ind =  this.AccountTypes.findIndex (el => el.accountType_Ext === this.accountTypeIDLedger.value)
   let accType = (this.AccountTypes[ind].xActTypeCode == 1) ? 'Active' : 'Passive'
   this.accountLedgerModifyForm.controls['d_APType'].patchValue(accType)
  }
  updateAccountData(action:string){
    console.log('action',action);
    switch (action) {
      case 'Create_Example':
      case 'Create':
        this.formDisabledFields.forEach(elem => this.accountModifyForm.controls[elem].enable())
        this.AccountingDataService.createAccountAccounting (this.accountModifyForm.value).then ( (result) => {
          if (result['name']=='error') {
            this.snack.open('Error: ' + result['detail'].split("\n", 1).join(""),'OK',{panelClass: ['snackbar-error']}); 
          } else {
            this.snack.open('Created: ' + result + ' account','OK',{panelClass: ['snackbar-success'], duration: 3000});
            this.AccountingDataService.sendReloadAccontList (this.accountModifyForm.controls['accountId']);
          }
        })
        this.formDisabledFields.forEach(elem => this.accountModifyForm.controls[elem].disable())
      break;

      case 'Edit':
        this.formDisabledFields.forEach(elem => this.accountModifyForm.controls[elem].enable())
        this.AccountingDataService.updateAccountAccounting (this.accountModifyForm.value).then ( (result) => {
          if (result['name']=='error') {
            this.snack.open('Error: ' + result['detail'].split("\n", 1).join(""),'OK',{panelClass: ['snackbar-error']} ) 
          } else {
            this.snack.open('Updated: ' + result + ' account','OK',{panelClass: ['snackbar-success'], duration: 3000})
            this.AccountingDataService.sendReloadAccontList (this.accountModifyForm.controls['accountId']);
          }
        this.formDisabledFields.forEach(elem => this.accountModifyForm.controls[elem].disable())

        })
      break;

      case 'Delete':
        this.dialogRefConfirm = this.dialog.open(AppConfimActionComponent, {panelClass: 'custom-modalbox',} );
        this.dialogRefConfirm.componentInstance.actionToConfim = {'action':'Delete Account' ,'isConfirmed': false}
        this.dialogRefConfirm.afterClosed().subscribe (actionToConfim => {
          console.log('action', actionToConfim)
          if (actionToConfim.isConfirmed===true) {
          this.accountModifyForm.controls['accountId'].enable()
          this.AccountingDataService.deleteAccountAccounting (this.accountModifyForm.value['accountId']).then ((result) =>{
            if (result['name']=='error') {
              this.snack.open('Error: ' + result['detail'],'OK',{panelClass: ['snackbar-error']} ) 
            } else {
              this.snack.open('Deleted: ' + result + ' account','OK',{panelClass: ['snackbar-success'], duration: 3000})
              this.AccountingDataService.sendReloadAccontList (this.accountModifyForm.controls['accountId']);
              this.dialog.closeAll();
            }
          })
         
          }
        })
      break;
    }
  }
  updateLedgerAccountData (action:string){
    console.log('action',action);
    switch (action) {
      case 'Create_Example':
      case 'Create':
        this.formLedgerDisabledFields.forEach(elem => this.accountLedgerModifyForm.controls[elem].enable())
        this.AccountingDataService.createLedgerAccountAccounting (this.accountLedgerModifyForm.value).then ( (result) => {
          if (result['name']=='error') {
            this.snack.open('Error: ' + result['detail'].split("\n", 1).join(""),'OK',{panelClass: ['snackbar-error']}); 
          } else {
            this.snack.open('Created: ' + result + ' account','OK',{panelClass: ['snackbar-success'], duration: 3000});
            this.AccountingDataService.sendReloadLedgerAccontList (this.ledgerNoId.value);
          }
        })
        this.formLedgerDisabledFields.forEach(elem => this.accountLedgerModifyForm.controls[elem].disable())
      break;

      case 'Edit':
        this.formLedgerDisabledFields.forEach(elem => this.accountLedgerModifyForm.controls[elem].enable())
        this.AccountingDataService.updateLedgerAccountAccounting (this.accountLedgerModifyForm.value).then ( (result) => {
          if (result['name']=='error') {
            this.snack.open('Error: ' + result['detail'].split("\n", 1).join(""),'OK',{panelClass: ['snackbar-error']} ) 
          } else {
            this.snack.open('Updated: ' + result + ' account','OK',{panelClass: ['snackbar-success'], duration: 3000})
            this.AccountingDataService.sendReloadLedgerAccontList (this.ledgerNoId.value);
          }
        this.formLedgerDisabledFields.forEach(elem => this.accountLedgerModifyForm.controls[elem].disable())
        })
      break;

      case 'Delete':
        this.dialogRefConfirm = this.dialog.open(AppConfimActionComponent, {panelClass: 'custom-modalbox',} );
        this.dialogRefConfirm.componentInstance.actionToConfim = {'action':'Delete Account' ,'isConfirmed': false}
        this.dialogRefConfirm.afterClosed().subscribe (actionToConfim => {
          console.log('action', actionToConfim)
          if (actionToConfim.isConfirmed===true) {
          this.ledgerNoId.enable()
          this.AccountingDataService.deleteLedgerAccountAccounting (this.ledgerNoId.value).then ((result) =>{
            if (result['name']=='error') {
              this.snack.open('Error: ' + result['detail'],'OK',{panelClass: ['snackbar-error']} ) 
            } else {
              this.snack.open('Deleted: ' + result + ' account','OK',{panelClass: ['snackbar-success'], duration: 3000})
              this.AccountingDataService.sendReloadLedgerAccontList (this.ledgerNoId.value);
              this.dialog.closeAll();
            }
          })
         
          }
        })
      break;
    }
  }
  get  accountNo() {return this.accountModifyForm.get('accountNo')}​
  get  Information() {return this.accountModifyForm.get('Information')}​
  get  accountTypeExt ()   {return this.accountModifyForm.get('accountTypeExt') } 
  get  clientId ()   {return this.accountModifyForm.get('clientId') } 
  get  currencyCode ()   {return this.accountModifyForm.get('currencyCode') } 
  get  entityTypeCode ()   {return this.accountModifyForm.get('entityTypeCode') } 
  get  accountId ()   {return this.accountModifyForm.get('accountId') } 
  get  d_clientname ()   {return this.accountModifyForm.get('d_clientname') } 
  get  d_portfolioCode ()   {return this.accountModifyForm.get('d_portfolioCode') } 

  get  ledgerNo() {return this.accountLedgerModifyForm.get('ledgerNo')}​
  get  ledgerNoId() {return this.accountLedgerModifyForm.get('ledgerNoId')}​
  get  clientIDledger() {return this.accountLedgerModifyForm.get('clientID')}​
  get  accountTypeIDLedger() {return this.accountLedgerModifyForm.get('accountTypeID')}​
  get  currecyCodeLedger () {return this.accountLedgerModifyForm.get('currecyCode')}​
  get  entityTypeCodeLedger () {return this.accountLedgerModifyForm.get('entityTypeCode')}​
  get  nameLedger () {return this.accountLedgerModifyForm.get('name')}​
  get  d_APTypeCodeAccount () {return this.accountLedgerModifyForm.get('d_APTypeCodeAccount')}
  get  d_APType () {return this.accountLedgerModifyForm.get('d_APType')}
  ​
}
