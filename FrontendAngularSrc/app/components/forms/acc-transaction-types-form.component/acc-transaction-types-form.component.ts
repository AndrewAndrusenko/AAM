import { Component, EventEmitter,  Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { filter, switchMap } from 'rxjs';
import { HadlingCommonDialogsService } from 'FrontendAngularSrc/app/services/hadling-common-dialogs.service';
import { bcTransactionType_Ext } from 'FrontendAngularSrc/app/models/accountng-intefaces.model';
import { AccountingSchemesService } from 'FrontendAngularSrc/app/services/accounting-schemes.service';
@Component({
  selector: 'acc-transaction-types-form',
  templateUrl: './acc-transaction-types-form.component.html',
  styleUrls: ['./acc-transaction-types-form.component.scss'],
})
export class AppAccTransactionTypesFormComponent {
  TransactionTypeForm: FormGroup;
  TransactionTypes: string[][]
  @Input() action: string;
  @Input() data: bcTransactionType_Ext|{id:number,object_id:number};
  @Output() public modal_principal_parent = new EventEmitter();
  constructor (
    private fb:FormBuilder, 
    private CommonDialogsService:HadlingCommonDialogsService,
    private AccountingSchemesService:AccountingSchemesService,
  ) 
  {   
    this.TransactionTypes = Array.from(this.AccountingSchemesService.TransactionTypes);
    this.TransactionTypeForm = this.fb.group ({
      id :{value:null, disabled: false},
      xActTypeCode_Ext: [null, { validators:  [Validators.required]}],
      manual_edit_forbidden: [false],
      description: [null, { validators:  [Validators.required]}],
      code2: [null, { validators:  [Validators.required]}],
    })
  }
  ngOnInit(): void {
    this.action==='View'? this.TransactionTypeForm.disable():null;
    this.TransactionTypeForm.patchValue(this.data);
  }
   snacksBox(result:{name:string,detail:string}|bcTransactionType_Ext[], action?:string){
    if (result['name']=='error') {
      this.CommonDialogsService.snackResultHandler(result)
    } else {
      this.CommonDialogsService.snackResultHandler({name:'success', detail: (result as bcTransactionType_Ext[]).length + ' transaction types'}, action,undefined,false)
      this.AccountingSchemesService.sendTransactionTypesReload();
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
        this.AccountingSchemesService.updateTransactionTypes(dataToUpdate,'Create').subscribe(result => this.snacksBox(result,'Created'))
      break;
      case 'Edit':
        this.AccountingSchemesService.updateTransactionTypes (dataToUpdate,'Edit').subscribe(result => this.snacksBox(result,'Updated'))
      break;
      case 'Delete':
        this.CommonDialogsService.confirmDialog('Delete Action: Transaction Type ID: '+this.id.value,'Delete').pipe(
          filter (isConfirmed => (isConfirmed.isConfirmed)),
          switchMap(() => this.AccountingSchemesService.updateTransactionTypes(dataToUpdate,'Delete'))
        ).subscribe(result => this.snacksBox(result,'Deleted'))
      break;
    }
  }
  get  id() {return this.TransactionTypeForm.get('id')}
  get  xActTypeCode_Ext () {return this.TransactionTypeForm.get('xActTypeCode_Ext') } 
  get  manual_edit_forbidden () {return this.TransactionTypeForm.get('manual_edit_forbidden') } 
  get  description () {return this.TransactionTypeForm.get('description') } 
  get  code2 () {return this.TransactionTypeForm.get('code2') } 
}
