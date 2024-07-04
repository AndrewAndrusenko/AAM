import { Component,  EventEmitter,  Input, OnInit, Output, ViewChild,  } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { AppConfimActionComponent } from '../../common-forms/app-confim-action/app-confim-action.component';
import { AppSnackMsgboxComponent } from '../../common-forms/app-snack-msgbox/app-snack-msgbox.component';
import { customAsyncValidators } from 'src/app/services/customAsyncValidators.service';
import { AppAccountingService } from 'src/app/services/accounting.service';
import { bAccounts, bLedger, bcAccountType_Ext, bcEnityType } from 'src/app/models/accountng-intefaces.model';
import { AppClientsTableComponent } from '../../tables/clients-table.component/clients-table.component';
import { TablePortfolios } from '../../tables/portfolios-table.component/portfolios-table.component';
import { Observable, Subscription, distinctUntilChanged, filter, map, startWith, switchMap } from 'rxjs';
import { MatTabGroup as MatTabGroup } from '@angular/material/tabs';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { AtuoCompleteService } from 'src/app/services/auto-complete.service';
import { ClientData, currencyCode } from 'src/app/models/interfaces.model';
import { indexDBService } from 'src/app/services/indexDB.service';

@Component({
  selector: 'app-acc-account-modify-form',
  templateUrl: './acc-account-form.component.html',
  styleUrls: ['./acc-account-form.component.scss'],
})
export class AppAccAccountModifyFormComponent implements OnInit {
  private subscriptions = new Subscription
  public panelOpenState = true;
  public accountModifyForm: FormGroup;
  public accountLedgerModifyForm: FormGroup;
  @Input() action: string;
  dialogRefConfirm: MatDialogRef<AppConfimActionComponent>;
  dialogChoseAccount: MatDialogRef<TablePortfolios>;
  dialogChoseClient: MatDialogRef<AppClientsTableComponent>;
  @Output() public modal_principal_parent = new EventEmitter();
  public title: string;
  public aType:number = null;
  public actionType : string;
  public actionToConfim = {'action':'delete_client' ,'isConfirmed': false}
  public AppSnackMsgbox : AppSnackMsgboxComponent
  public data: bAccounts|bLedger;
  public FirstOpenedAccountingDate : Date
  @ViewChild(MatTabGroup) tabGroup: MatTabGroup;
  EnityTypes: bcEnityType[] = [];
  AccountTypes: bcAccountType_Ext[] = [];
  formDisabledFields: string[] = [];
  formLedgerDisabledFields: string[] = []; 
  filteredCurrenciesList: Observable<currencyCode[]>;
  filterednstrumentsLists : Observable<string[][]>;

  constructor (
    private fb:FormBuilder, 
    private dialog: MatDialog, 
    private AccountingDataService:AppAccountingService, 
    private CommonDialogsService:HadlingCommonDialogsService,
    private AutoCompService:AtuoCompleteService,
    private indexDBService:indexDBService
  ) 
  { this.AccountingDataService.GetEntityTypeList('',0,'','','bcEnityType').subscribe (data => this.EnityTypes=data)
    this.indexDBService.getIndexDBStaticTables('bcAccountType_Ext').subscribe (data => this.AccountTypes=data.data as bcAccountType_Ext[])
    this.formDisabledFields = ['clientId', 'accountId', 'idportfolio']
    this.formLedgerDisabledFields = ['ledgerNoId', 'clientID']
    this.accountModifyForm = this.fb.group ({
      accountNo: [null, {validators: [Validators.required], updateOn:'blur' } ],   
      accountTypeExt:[null, [Validators.required]] ,  
      dateOpening:[new Date(), [Validators.required]] ,  
      Information: {value:null, disabled: false},  
      clientId: {value:null, disabled: true},  
      currencyCode: [null],  
      secid:[null],  
      entityTypeCode: [null, [Validators.required]], 
      accountId: {value:null, disabled: false},
      idportfolio: {value:null, disabled: true},
      d_clientname: {value:null, disabled: true}, 
      d_portfolioCode: {value:null, disabled: true}
    })
    this.accountLedgerModifyForm = this.fb.group ({
      ledgerNoId: {value:null, disabled: true},
      ledgerNo: [null, {validators: [Validators.required], updateOn:'blur' } ],
      name: [null, [Validators.required]], 
      accountTypeID: [null, [Validators.required]],  
      accountId: {value:null, disabled: false},
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
      dateOpening:[new Date(), [Validators.required]] 
    })
    this.subscriptions.add(this.AutoCompService.subCurrencyList.subscribe(()=>this.currencyCode.updateValueAndValidity()));
    this.subscriptions.add(this.AutoCompService.subSecIdList.subscribe(()=>this.secid.updateValueAndValidity()));

  }
  ngOnInit(): void {
    this.AccountingDataService.GetbParamsgfirstOpenedDate('GetbParamsgfirstOpenedDate').subscribe(data => this.FirstOpenedAccountingDate = data[0].FirstOpenedDate);
    (this.aType == 1)? this.accountLedgerModifyForm.patchValue(this.data): this.accountModifyForm.patchValue(this.data);
    this.action==='View'? this.accountLedgerModifyForm.disable():null;
    this.action==='View'? this.accountModifyForm.disable():null;
    this.AutoCompService.subCurrencyList.next(true);
    this.filteredCurrenciesList = this.currencyCode.valueChanges.pipe (
      startWith (''),
      distinctUntilChanged(),
      map(value => this.AutoCompService.filterList(value || '','currency') as currencyCode[] )
      );
    this.AutoCompService.subSecIdList.next(true);
    this.filterednstrumentsLists = this.secid.valueChanges.pipe(
        startWith(''),
        distinctUntilChanged(),
        map((value) => this.AutoCompService.filterList(value || '','secid') as string[][])
    );
  }
  ngAfterContentInit(): void {
    let accType = this.d_APTypeCodeAccount.value == 1 ? 'Active' : 'Passive'
    this.accountLedgerModifyForm.controls['d_APType'].patchValue(accType)
    let accountNoToCheck =   this.accountNo.value;
    let accountNoToCheckLedger = this.ledgerNo.value;
    if (this.action === 'Create_Example') {
      accountNoToCheck =   null;
      accountNoToCheckLedger = null;
      this.action='Create'
      this.accountNo.setErrors({accountIsTaken:true})
      this.ledgerNo.setErrors({accountIsTaken:true})
    } 
    this.accountNo.setAsyncValidators (
      customAsyncValidators.AccountingUniqueAccountNoAsyncValidator(this.AccountingDataService, accountNoToCheck) 
    )
    this.accountNo.updateValueAndValidity();  
    this.ledgerNo.setAsyncValidators (
      customAsyncValidators.AccountingUniqueLedgerNoAsyncValidator(this.AccountingDataService, accountNoToCheckLedger) 
    )
    this.ledgerNo.updateValueAndValidity();  
    this.setValidators();
  }
  setValidators () {
    if (this.accountTypeExt.value==15) {
      this.secid.setValidators(this.AutoCompService.secidValirator());
      this.currencyCode.clearValidators(); 
      this.currencyCode.updateValueAndValidity()
    } else {
       this.currencyCode.setValidators(this.AutoCompService.currencyValirator());
    }
  }
  accountTypeChanges (){
    this.setValidators();
  }
  selectPortfolio () {
    this.dialogChoseAccount = this.dialog.open(TablePortfolios ,{minHeight:'600px', minWidth:'1300px', autoFocus: false, maxHeight: '90vh'});
    this.dialogChoseAccount.componentInstance.action = "Select";
    this.dialogChoseAccount.componentInstance.readOnly = true;
    this.dialogChoseAccount.componentInstance.clientId = this.clientId.value;
    this.dialogChoseAccount.componentInstance.actionOnAccountTable = "Get_Portfolios_By_CientId";
    
    this.dialogChoseAccount.componentInstance.modal_principal_parent.subscribe ((item)=>{
      this.accountModifyForm.controls['idportfolio'].patchValue(item['idportfolio'])
      this.accountModifyForm.controls['d_portfolioCode'].patchValue(item['portfolioname'])
      this.dialogChoseAccount.close(); 
    });
  }
  selectClient () {
    this.dialogChoseClient = this.dialog.open(AppClientsTableComponent ,{minHeight:'600px', minWidth:'90vw', autoFocus: false, maxHeight: '90vh'});
    this.dialogChoseClient.componentInstance.action = "Select";
    this.dialogChoseClient.componentInstance.modal_principal_parent.subscribe ((item:ClientData)=>{
      this.accountModifyForm.controls['clientId'].patchValue(item.idclient)
      this.accountLedgerModifyForm.controls['clientID'].patchValue(item.idclient)
      this.accountModifyForm.controls['d_clientname'].patchValue(item.clientname)
      this.accountLedgerModifyForm.controls['d_Client'].patchValue(item.clientname)
      this.dialogChoseClient.close(); 
    });
  }
  changeAccountType () {
   let ind =  this.AccountTypes.findIndex (el => el.accountType_Ext === this.accountTypeIDLedger.value)
   let accType = (this.AccountTypes[ind].xActTypeCode == 1) ? 'Active' : 'Passive'
   this.accountLedgerModifyForm.controls['d_APType'].patchValue(accType)
  }
  snacksBox(result:{name:string,detail:string}|number, action?:string){
    if (result['name']=='error') {
      this.CommonDialogsService.snackResultHandler(result)
    } else {
      this.CommonDialogsService.snackResultHandler({name:'success', detail: result + ' account'}, action);
      this.aType == 1? this.AccountingDataService.sendReloadLedgerAccontList (this.ledgerNoId.value): this.AccountingDataService.sendReloadAccontList (this.accountId.value);
    }
  }
  updateAccountData(action:string){
    this.formDisabledFields.forEach(elem => this.accountModifyForm.controls[elem].enable())
    switch (action) {
      case 'Create':
        this.AccountingDataService.updateAccountAccounting(this.accountModifyForm.value,'Create').subscribe(result => this.snacksBox(result.length,'Created'))
      break;
      case 'Edit':
        this.AccountingDataService.updateAccountAccounting (this.accountModifyForm.value,'Edit').subscribe(result => this.snacksBox(result.length,'Updated'))
      break;
      case 'Delete':
        this.CommonDialogsService.confirmDialog('Delete Account ' + this.accountNo.value).pipe(
          filter (confirm => confirm.isConfirmed),
          switchMap(() => this.AccountingDataService.updateAccountAccounting(this.accountModifyForm.value,'Delete'))
        ).subscribe(result => this.snacksBox(result.length,'Deleted'))
      break;
    }
  }
  updateLedgerAccountData (action:string){
    this.formLedgerDisabledFields.forEach(elem => this.accountLedgerModifyForm.controls[elem].enable())
    switch (action) {
      case 'Create_Example':
      case 'Create':
        this.AccountingDataService.updateLedgerAccountAccounting(this.accountLedgerModifyForm.value,'Create').subscribe(result => this.snacksBox(result.length,'Created'))
      break;
      case 'Edit':
        this.AccountingDataService.updateLedgerAccountAccounting (this.accountLedgerModifyForm.value,'Edit').subscribe(result => this.snacksBox(result.length,'Updated'))
      break;
      case 'Delete':
        this.CommonDialogsService.confirmDialog('Delete Account ' + this.ledgerNo.value).pipe(
          filter (confirm =>confirm.isConfirmed),
          switchMap(() => this.AccountingDataService.updateLedgerAccountAccounting(this.accountLedgerModifyForm.value,'Delete'))
        ).subscribe(result => this.snacksBox(result.length,'Deleted'))
      break;
    }
  }
  get  accountNo() {return this.accountModifyForm.get('accountNo')}​
  get  Information() {return this.accountModifyForm.get('Information')}​
  get  accountTypeExt ()   {return this.accountModifyForm.get('accountTypeExt') } 
  get  clientId ()   {return this.accountModifyForm.get('clientId') } 
  get  currencyCode ()   {return this.accountModifyForm.get('currencyCode') } 
  get  secid ()   {return this.accountModifyForm.get('secid') } 
  get  dateOpening ()   {return this.accountModifyForm.get('dateOpening') } 
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
  get  dateOpeningLedger ()   {return this.accountLedgerModifyForm.get('dateOpening') } 
}
