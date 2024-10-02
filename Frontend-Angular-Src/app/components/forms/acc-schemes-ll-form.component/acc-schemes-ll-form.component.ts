import { Component, EventEmitter,  Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription, debounceTime, distinctUntilChanged, filter, switchMap, tap } from 'rxjs';
import { HadlingCommonDialogsService } from 'Frontend-Angular-Src/app/services/hadling-common-dialogs.service';
import { AccountingSchemesService } from 'Frontend-Angular-Src/app/services/accounting-schemes.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AppTableAccLedgerAccountsComponent } from '../../tables/acc-accounts-ledger-table.component/acc-accounts-ledger-table.component';
import { bcSchemeLedgerTransaction, bcSchemesParameters, bcSchemesProcesses } from 'Frontend-Angular-Src/app/models/acc-schemes-interfaces';
import { AppAccountingService } from 'Frontend-Angular-Src/app/services/accounting.service';
@Component({
  selector: 'acc-schemes-ll-form',
  templateUrl: './acc-schemes-ll-form.component.html',
  styleUrls: ['./acc-schemes-ll-form.component.scss'],
})
export class AppAccSchemesLL_FormComponent {
  subscriptions = new Subscription;
  SchemeFormLL: FormGroup;
  TransactionTypes: string[][]
  TransactionCodes: {id:string,name:string}[];
  schemesParams: bcSchemesParameters[];
  dialogChoseAccount:MatDialogRef<AppTableAccLedgerAccountsComponent>;
  @Input() schemesProcess: bcSchemesProcesses[];
  @Input() action: string;
  @Input() data: bcSchemeLedgerTransaction|{id:number,object_id:number};
  @Output() public modal_principal_parent = new EventEmitter();
  constructor (
    private AppAccountingService:AppAccountingService,
    private CommonDialogsService:HadlingCommonDialogsService,
    private AccountingSchemesService:AccountingSchemesService,
    private fb:FormBuilder, 
    private dialog:MatDialog
  ) 
  {     }
  ngOnInit(): void {
    this.TransactionTypes = Array.from(this.AccountingSchemesService.TransactionTypes);
    this.SchemeFormLL = this.fb.group ({
      XactTypeCode_Ext:[null, { validators:  [Validators.required]}],
      id:[null],
      XactTypeCode:['0', { validators:  [Validators.required]}],
      amount:[null, { validators:  [Validators.required]}],
      accountNo:[null],
      entryDetails:[null, { validators:  [Validators.required]}],
      cSchemeGroupId:[null, { validators:  [Validators.required]}],
      extTransactionId:[null],
      ledgerID:[null, { validators:  [Validators.required]}],
      idtrade:[null],
      dateTime:[null],
      ledgerID_Debit:[null, { validators:  [Validators.required]}],
      ledger_credit:[null],
      ledger_debit:[null],
    })
    this.action==='View'? this.SchemeFormLL.disable():null;
    this.SchemeFormLL.patchValue(this.data);
    this.AccountingSchemesService.getSchemesParameters().subscribe(data=>this.schemesParams=data);
    this.subscriptions.add(
      this.ledgerID_Debit.valueChanges.pipe
      (distinctUntilChanged(),
      debounceTime(200),
      tap(data=>Number.isNaN(+data)===true? this.ledger_debit.patchValue(data):null),
      filter(data=>Number.isNaN(+data)===false&&data!==''),
      switchMap(id=>this.AppAccountingService.GetLedgerNoById(id)))
      .subscribe(accountNo=>this.ledger_debit.patchValue(accountNo.length===0? this.ledgerID_Debit.value:accountNo[0].ledgerNo))
    )
    this.subscriptions.add(
      this.ledgerID.valueChanges.pipe
      (distinctUntilChanged(),
      debounceTime(200),
      tap(data=>Number.isNaN(+data)===true? this.ledger_credit.patchValue(data):null),
      filter(data=>Number.isNaN(+data)===false&&data!==''),
      switchMap(id=>this.AppAccountingService.GetLedgerNoById(id)))
      .subscribe(ledgerNo=>this.ledger_credit.patchValue(ledgerNo.length===0? this.ledgerID.value:ledgerNo[0].ledgerNo))
    )
  }
   snacksBox(result:{name:string,detail:string}|number, action?:string){
    if (result['name']=='error') {
      this.CommonDialogsService.snackResultHandler(result)
    } else {
      this.CommonDialogsService.snackResultHandler({name:'success', detail: result + ' LL schemes'}, action,undefined,false)
      this.AccountingSchemesService.sendSchemeLedgerTransactionReload();
      this.modal_principal_parent.emit(true)
    }
  }
  selectLedger (accountType: string) {
      this.dialogChoseAccount = this.dialog.open(AppTableAccLedgerAccountsComponent ,{minHeight:'600px', minWidth:'1600px', autoFocus: false, maxHeight: '90vh'});
      this.dialogChoseAccount.componentInstance.readOnly = true;
      this.dialogChoseAccount.componentInstance.modal_principal_parent.subscribe ((item)=>{
        if (accountType==='debit') {
          this.ledger_debit.patchValue(item.accountNo)
          this.ledgerID_Debit.patchValue(item.id)
        } else {
          this.ledger_credit.patchValue(item.accountNo)
          this.ledgerID.patchValue(item.id)
        }
        this.dialogChoseAccount.close(); 
      });
  }
  updateSchemeDataLL(action:string){
    this.SchemeFormLL.updateValueAndValidity();
    let dataToUpdate = structuredClone(this.SchemeFormLL.value);
    if (this.SchemeFormLL.invalid) {return}
    switch (action) {
      case 'Create_Example':
      case 'Create':
        this.AccountingSchemesService.updateSchemeLedgerTransaction(dataToUpdate,'Create','bcSchemeLedgerTransaction').subscribe(result => this.snacksBox(result.length,'Created'))
      break;
      case 'Edit':
        this.AccountingSchemesService.updateSchemeLedgerTransaction (dataToUpdate,'Edit','bcSchemeLedgerTransaction').subscribe(result => this.snacksBox(result.length,'Updated'))
      break;
      case 'Delete':
        this.CommonDialogsService.confirmDialog('Delete Action: LL Accounting Scheme: '+this.id.value,'Delete').pipe(
          filter (isConfirmed => (isConfirmed.isConfirmed)),
          switchMap(() => this.AccountingSchemesService.updateSchemeLedgerTransaction(dataToUpdate,'Delete','bcSchemeLedgerTransaction'))
        ).subscribe(result => this.snacksBox(result.length,'Deleted'))
      break;
    }
  }
  get  id() {return this.SchemeFormLL.get('id')}
  get  XactTypeCode_Ext () {return this.SchemeFormLL.get('XactTypeCode_Ext') } 
  get  entryDetails () {return this.SchemeFormLL.get('entryDetails') } 
  get  XactTypeCode () {return this.SchemeFormLL.get('XactTypeCode') } 
  get  amount () {return this.SchemeFormLL.get('amount') } 
  get  cSchemeGroupId () {return this.SchemeFormLL.get('cSchemeGroupId') } 
  get  ledgerID () {return this.SchemeFormLL.get('ledgerID') } 
  get  ledgerID_Debit () {return this.SchemeFormLL.get('ledgerID_Debit') } 
  get  ledger_credit () {return this.SchemeFormLL.get('ledger_credit') } 
  get  ledger_debit () {return this.SchemeFormLL.get('ledger_debit') } 
  get  idtrade () {return this.SchemeFormLL.get('idtrade') } 
  get  dateTime () {return this.SchemeFormLL.get('dateTime') } 
}