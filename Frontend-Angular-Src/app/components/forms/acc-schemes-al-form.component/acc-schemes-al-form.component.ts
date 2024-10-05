import { Component, EventEmitter,  Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription, debounceTime, distinctUntilChanged, filter, switchMap, tap } from 'rxjs';
import { HadlingCommonDialogsService } from 'Frontend-Angular-Src/app/services/hadling-common-dialogs.service';
import { AccountingSchemesService } from 'Frontend-Angular-Src/app/services/accounting-schemes.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AppTableAccLedgerAccountsComponent } from '../../tables/acc-accounts-ledger-table.component/acc-accounts-ledger-table.component';
import { bcSchemeAccountTransaction, bcSchemesParameters, bcSchemesProcesses } from 'Frontend-Angular-Src/app/models/acc-schemes-interfaces';
import { AppAccountingService } from 'Frontend-Angular-Src/app/services/accounting.service';
import { AppTableAccAccountsComponent } from '../../tables/acc-accounts-table.component/acc-accounts-table.component';
@Component({
  selector: 'acc-schemes-al-form',
  templateUrl: './acc-schemes-al-form.component.html',
  styleUrls: ['./acc-schemes-al-form.component.scss'],
})
export class AppAccSchemesAL_FormComponent {
  subscriptions = new Subscription()
  SchemeFormAL: FormGroup;
  TransactionTypes: string[][]
  TransactionCodes: {id:string,name:string,code2:string}[];
  TransactionCodesFiltered: {id:string,name:string,code2:string}[];
  schemesParams: bcSchemesParameters[];
  dialogChoseAccount:MatDialogRef<AppTableAccLedgerAccountsComponent>;
  dialogChoseAccountAc:MatDialogRef<AppTableAccAccountsComponent>;
  @Input() schemesProcess: bcSchemesProcesses[];
  @Input() action: string;
  @Input() data: bcSchemeAccountTransaction|{id:number,object_id:number};
  @Output() public modal_principal_parent = new EventEmitter();
  constructor (
    private fb:FormBuilder, 
    private CommonDialogsService:HadlingCommonDialogsService,
    private AccountingSchemesService:AccountingSchemesService,
    private AppAccountingService:AppAccountingService,
    private dialog:MatDialog
  ) 
  {  
    this.SchemeFormAL = this.fb.group ({
      XactTypeCode_Ext:[null, { validators:  [Validators.required]}],
      id:[null],
      XactTypeCode:['0', { validators:  [Validators.required]}],
      amountTransaction:[null, { validators:  [Validators.required]}],
      accountNo:[null],
      entryDetails:[null, { validators:  [Validators.required]}],
      cSchemeGroupId:[null, { validators:  [Validators.required]}],
      extTransactionId:[null],
      ledgerNoId:[null, { validators:  [Validators.required]}],
      idtrade:[null],
      dataTime:[null],
      accountId:[null, { validators:  [Validators.required]}],
      ledger_no:[null],
      account_no:[null],
    })
    }
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  ngOnInit(): void {
    this.TransactionTypes = Array.from(this.AccountingSchemesService.TransactionTypes).filter(el=>el[0]!=='0');
    this.action==='View'? this.SchemeFormAL.disable():null;
    this.SchemeFormAL.patchValue(this.data);
    this.changeTransactionType()
    this.subscriptions.add(
      this.accountId.valueChanges.pipe
      (distinctUntilChanged(),
      debounceTime(200),
      tap(data=>Number.isNaN(+data)===true? this.account_no.patchValue(data):null),
      filter(data=>Number.isNaN(+data)===false&&data!==''),
      switchMap(id=>this.AppAccountingService.GetAccountNoById(id)))
      .subscribe(accountNo=>this.account_no.patchValue(accountNo.length===0? this.accountId.value:accountNo[0].accountNo))
    )
    this.subscriptions.add(
      this.ledgerNoId.valueChanges.pipe
      (distinctUntilChanged(),
      debounceTime(200),
      tap(data=>Number.isNaN(+data)===true? this.ledger_no.patchValue(data):null),
      filter(data=>Number.isNaN(+data)===false&&data!==''),
      switchMap(id=>this.AppAccountingService.GetLedgerNoById(id)))
      .subscribe(ledgerNo=>this.ledger_no.patchValue(ledgerNo.length===0? this.ledgerNoId.value:ledgerNo[0].ledgerNo))
    )
    this.subscriptions.add(this.AccountingSchemesService.getSchemesParameters().subscribe(data=>this.schemesParams=data));
  }
   snacksBox(result:{name:string,detail:string}|number, action?:string){
    if (result['name']=='error') {
      this.CommonDialogsService.snackResultHandler(result)
    } else {
      this.CommonDialogsService.snackResultHandler({name:'success', detail: result + ' AL schemes'}, action,undefined,false)
      this.AccountingSchemesService.sendSchemeAccountTransactionReload();
      this.modal_principal_parent.emit(true)
    }
  }
  selectAccount () {
    this.dialogChoseAccountAc = this.dialog.open(AppTableAccAccountsComponent ,{minHeight:'600px', minWidth:'1600px', autoFocus: false, maxHeight: '90vh'});
    this.dialogChoseAccountAc.componentInstance.readOnly = true;
    this.dialogChoseAccountAc.componentInstance.modal_principal_parent.subscribe ((item)=>{
      this.account_no.patchValue(item.accountNo)
      this.accountId.patchValue(item.id)
      this.dialogChoseAccountAc.close(); 
    });
  }
  selectLedger () {
      this.dialogChoseAccount = this.dialog.open(AppTableAccLedgerAccountsComponent ,{minHeight:'600px', minWidth:'1600px', autoFocus: false, maxHeight: '90vh'});
      this.dialogChoseAccount.componentInstance.readOnly = true;
      this.dialogChoseAccount.componentInstance.modal_principal_parent.subscribe ((item)=>{
        this.ledger_no.patchValue(item.accountNo)
        this.ledgerNoId.patchValue(item.id)
        this.dialogChoseAccount.close(); 
      });
  }
  changeTransactionType () {
    this.TransactionCodesFiltered = this.XactTypeCode.value? this.TransactionCodes.filter(el=>el.code2===this.XactTypeCode.value) :this.TransactionCodes;
  }
  updateSchemeDataLL(action:string){
    this.SchemeFormAL.updateValueAndValidity();
    let dataToUpdate = structuredClone(this.SchemeFormAL.value);

    if (this.SchemeFormAL.invalid) {return}
    switch (action) {
      case 'Create_Example':
      case 'Create':
        this.AccountingSchemesService.updateSchemeLedgerTransaction(dataToUpdate,'Create','bcSchemeAccountTransaction').subscribe(result => this.snacksBox(result.length,'Created'))
      break;
      case 'Edit':
        this.AccountingSchemesService.updateSchemeLedgerTransaction (dataToUpdate,'Edit','bcSchemeAccountTransaction').subscribe(result => this.snacksBox(result.length,'Updated'))
      break;
      case 'Delete':
        this.CommonDialogsService.confirmDialog('Delete Action: AL Accounting Scheme: '+this.id.value,'Delete').pipe(
          filter (isConfirmed => (isConfirmed.isConfirmed)),
          switchMap(() => this.AccountingSchemesService.updateSchemeLedgerTransaction(dataToUpdate,'Delete','bcSchemeAccountTransaction'))
        ).subscribe(result => this.snacksBox(result.length,'Deleted'))
      break;
    }
  }
  get  id() {return this.SchemeFormAL.get('id')}
  get  XactTypeCode_Ext () {return this.SchemeFormAL.get('XactTypeCode_Ext') } 
  get  entryDetails () {return this.SchemeFormAL.get('entryDetails') } 
  get  XactTypeCode () {return this.SchemeFormAL.get('XactTypeCode') } 
  get  amountTransaction () {return this.SchemeFormAL.get('amountTransaction') } 
  get  cSchemeGroupId () {return this.SchemeFormAL.get('cSchemeGroupId') } 
  get  ledgerNoId () {return this.SchemeFormAL.get('ledgerNoId') } 
  get  accountId () {return this.SchemeFormAL.get('accountId') } 
  get  account_no () {return this.SchemeFormAL.get('account_no') } 
  get  ledger_no () {return this.SchemeFormAL.get('ledger_no') } 
  get  idtrade () {return this.SchemeFormAL.get('idtrade') } 
  get  dataTime () {return this.SchemeFormAL.get('dataTime') } 
}