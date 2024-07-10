import { Component, EventEmitter,  Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription, debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs';
import { HadlingCommonDialogsService } from 'FrontendAngularSrc/app/services/hadling-common-dialogs.service';
import { accessTransactionTypes, bcTransactionType_Ext } from 'FrontendAngularSrc/app/models/accountng-intefaces.model';
import { AccountingSchemesService } from 'FrontendAngularSrc/app/services/accounting-schemes.service';
@Component({
  selector: 'acc-access-transaction-types-form',
  templateUrl: './acc-access-transaction-types-form.component.html',
  styleUrls: ['./acc-access-transaction-types-form.component.scss'],
})
export class AppAccAccessTTFormComponent {

  TransactionTypeForm: FormGroup;
  TransactionTypes:bcTransactionType_Ext[];
  subscriptions = new Subscription();
  @Input() accessRoles:string[]=[];
  @Input() action: string;
  @Input() data: accessTransactionTypes|{id:number,object_id:number};
  @Output() public modal_principal_parent = new EventEmitter();
  code2TT: Map<string, string>;
  constructor (
    private fb:FormBuilder, 
    private CommonDialogsService:HadlingCommonDialogsService,
    private AccountingSchemesService:AccountingSchemesService,
  ) 
  {  
    this.code2TT = this.AccountingSchemesService.TransactionTypes;
    this.subscriptions.add(this.AccountingSchemesService.receiveTransactionTypesReady().subscribe(data=>this.TransactionTypes=data.data.sort((a,b)=>a.id-b.id)))
    this.AccountingSchemesService.subjectTransactionTypePipe.next(null);
    this.TransactionTypeForm = this.fb.group ({
      id :{value:null, disabled: false},
      transaction_type_id: [null, { validators:  [Validators.required]}],
      xActTypeCode_Ext: [null, { validators:  [Validators.required]}],
      role: [null, { validators:  [Validators.required]}],
      description: [null, { validators:  [Validators.required]}],
      code2: [null, { validators:  [Validators.required]}],
    })
    this.subscriptions.add(this.transaction_type_id.valueChanges.pipe(distinctUntilChanged()).subscribe(newId=>this.ttLabelsChange(newId.toString())))
  }
  ngOnInit(): void {
    this.action==='View'? this.TransactionTypeForm.disable():null;
    this.TransactionTypeForm.patchValue(this.data);
  }
  ttChanged(newVal: number) {
    this.transaction_type_id.patchValue(newVal);
    this.ttLabelsChange(newVal);
    console.log('nv',newVal);
  }
  ttLabelsChange (id:number) {
    let newTT = this.TransactionTypes.filter(el=>el.id.toString()===id.toString())
    if (newTT.length===1) {
      this.code2.patchValue(newTT[0].code2)
      this.xActTypeCode_Ext.patchValue(newTT[0].xActTypeCode_Ext)
      this.description.patchValue(newTT[0].description)
      this.transaction_type_id.patchValue(newTT[0].id)
    } else {
      this.code2.patchValue('')
      this.xActTypeCode_Ext.patchValue('')
      this.description.patchValue('')
      this.transaction_type_id.patchValue(null)
    }
  }
  snacksBox(result:{name:string,detail:string}|bcTransactionType_Ext[], action?:string){
    if (result['name']=='error') {
      this.CommonDialogsService.snackResultHandler(result)
    } else {
      this.CommonDialogsService.snackResultHandler({name:'success', detail: (result as bcTransactionType_Ext[]).length + ' access TT'}, action,undefined,false)
      this.AccountingSchemesService.sendAceessTransactionTypesReload();
      this.modal_principal_parent.emit(true)
    }
  }
  updateTransactionTypeData(action:string){
    this.TransactionTypeForm.updateValueAndValidity();
    let dataToUpdate = structuredClone(this.TransactionTypeForm.value);

    if (this.TransactionTypeForm.invalid) {return}
    switch (action) {
      case 'Create_Example':
      case 'Create':
        this.AccountingSchemesService.updateAccessTransactionTypes(dataToUpdate,'Create').subscribe(result => this.snacksBox(result,'Created'))
      break;
      case 'Edit':
        this.AccountingSchemesService.updateAccessTransactionTypes (dataToUpdate,'Edit').subscribe(result => this.snacksBox(result,'Updated'))
      break;
      case 'Delete':
        this.CommonDialogsService.confirmDialog('Delete Action: Access TT ID: '+this.id.value,'Delete').pipe(
          filter (isConfirmed => (isConfirmed.isConfirmed)),
          switchMap(() => this.AccountingSchemesService.updateAccessTransactionTypes(dataToUpdate,'Delete'))
        ).subscribe(result => this.snacksBox(result,'Deleted'))
      break;
    }
  }
  get  id() {return this.TransactionTypeForm.get('id')}
  get  xActTypeCode_Ext () {return this.TransactionTypeForm.get('xActTypeCode_Ext') } 
  get  transaction_type_id () {return this.TransactionTypeForm.get('transaction_type_id') } 
  get  role () {return this.TransactionTypeForm.get('role') } 
  get  description () {return this.TransactionTypeForm.get('description') } 
  get  code2 () {return this.TransactionTypeForm.get('code2') } 
}
