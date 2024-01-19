import { Component,  EventEmitter,  Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {  filter, switchMap } from 'rxjs';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { AtuoCompleteService } from 'src/app/services/auto-complete.service';
import { FeesMainData } from 'src/app/models/fees-intefaces.model';
import { AppFeesHandlingService } from 'src/app/services/fees-handling.service';

@Component({
  selector: 'acc-fees-main-form',
  templateUrl: './acc-fees-main-form.component.html',
  styleUrls: ['./acc-fees-main-form.component.scss'],
})
export class AppAccFeesMainFormComponent {
 
  public FeesMainForm: FormGroup;
  @Input() action: string;
  @Input() data: FeesMainData;
  @Output() public modal_principal_parent = new EventEmitter();
  constructor (
    private fb:FormBuilder, 
    private CommonDialogsService:HadlingCommonDialogsService,
    // private indexDBServiceS: indexDBService,
    private AppFeesHandlingService:AppFeesHandlingService,
    private AtuoCompService:AtuoCompleteService,
  ) 
  {   
    this.AtuoCompService.getCurrencyList();
    this.FeesMainForm = this.fb.group ({
      id :{value:null, disabled: false},
      fee_code:[null, { validators:  [Validators.required]}],
      fee_type_desc: [null],
      fee_object_desc: {value:null, disabled: false},
      fee_description: [null, { validators:  [Validators.required]}],
      period_desc: {value:null, disabled: false},
      fee_type:[null, { validators:  [Validators.required]}],
      fee_object_type :[null, { validators:  [Validators.required]}],
      id_fee_period :{value:null, disabled: false}
    })
  }
  ngOnInit(): void {
    this.FeesMainForm.patchValue(this.data);
  }
  snacksBox(result:any, action?:string){
    if (result['name']=='error') {
      this.CommonDialogsService.snackResultHandler(result)
    } else {
      this.CommonDialogsService.snackResultHandler({name:'success', detail: result.length + ' fee schedules'}, action,undefined,false)
      this.AppFeesHandlingService.sendFeesMainDataReload(result,action);
      this.modal_principal_parent.emit(true)
    }
  }
  updateInstrumentData(action:string){
    this.FeesMainForm.updateValueAndValidity();
    if (this.FeesMainForm.invalid) {return}
    switch (action) {
      case 'Create_Example':
      case 'Create':
        this.AppFeesHandlingService.updateFeesMainData(this.FeesMainForm.value,'Create').subscribe(result => this.snacksBox(result,'Created'))
      break;
      case 'Edit':
        this.AppFeesHandlingService.updateFeesMainData (this.FeesMainForm.value,'Edit').subscribe(result => this.snacksBox(result,'Updated'))
      break;
      case 'Delete':
        this.CommonDialogsService.confirmDialog('Delete Action: Fee data and schedules','Delete').pipe(
          filter (isConfirmed => (isConfirmed.isConfirmed)),
          switchMap(() => this.AppFeesHandlingService.deleteFeesSchedulesCascade(this.id.value)),
          switchMap(() => this.AppFeesHandlingService.updateFeesMainData(this.FeesMainForm.value,'Delete'))
        ).subscribe(result => this.snacksBox(result,'Deleted'))
      break;
    }
  }
  get  fee_type() {return this.FeesMainForm.get('fee_type')}
  get  id() {return this.FeesMainForm.get('id')}
  get  fee_object_type () {return this.FeesMainForm.get('fee_object_type') } 
  get  fee_object_desc () {return this.FeesMainForm.get('fee_object_desc') } 
  get  fee_description () {return this.FeesMainForm.get('fee_description') } 
  get  couponamount () {return this.FeesMainForm.get('couponamount') } 
  get  date () {return this.FeesMainForm.get('date') }
  get  secid () {return this.FeesMainForm.get('secid') }
}