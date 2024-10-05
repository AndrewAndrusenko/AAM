import { Component,  EventEmitter,  Input, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { filter, switchMap } from 'rxjs';
import { HadlingCommonDialogsService } from 'Frontend-Angular-Src/app/services/hadling-common-dialogs.service';
import { AtuoCompleteService } from 'Frontend-Angular-Src/app/services/auto-complete.service';
import { FeesMainData } from 'Frontend-Angular-Src/app/models/fees-interfaces.model';
import { AppFeesHandlingService } from 'Frontend-Angular-Src/app/services/fees-handling.service';
import { AppaIAccFeesSchedulesTable } from '../../tables/acc-fees-schedules-table.component/acc-fees-schedules-table.component';
@Component({
  selector: 'acc-fees-main-form',
  templateUrl: './acc-fees-main-form.component.html',
  styleUrls: ['./acc-fees-main-form.component.scss'],
})
export class AppAccFeesMainFormComponent {
  public FeesMainForm: FormGroup;
  @Input() action: string;
  @Input() data: FeesMainData;
  @ViewChild('schedules') tableSchedules:AppaIAccFeesSchedulesTable
  @Output() public modal_principal_parent = new EventEmitter();
  constructor (
    private fb:FormBuilder, 
    private CommonDialogsService:HadlingCommonDialogsService,
    private AppFeesHandlingService:AppFeesHandlingService,
    private AtuoCompService:AtuoCompleteService,
  ) 
  {  
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
    this.AtuoCompService.fullCurrenciesList.length? null: this.AtuoCompService.subCurrencyList.next(true);
    this.action==='View'? this.FeesMainForm.disable():null;
    this.FeesMainForm.patchValue(this.data);
  }
  ngAfterViewInit(): void {
    if (this.tableSchedules) {
      this.tableSchedules.idFeeMain = this.id.value;
      this.tableSchedules.submitQuery(false,false);
    }
  }
  snacksBox(result:{name:string,detail:string}|FeesMainData[], action?:string){
    if (result['name']=='error') {
      this.CommonDialogsService.snackResultHandler(result)
    } else {
      this.CommonDialogsService.snackResultHandler({name:'success', detail: (result as FeesMainData[]).length + ' fee schedules'}, action,undefined,false)
      this.AppFeesHandlingService.sendFeesMainDataReload(result as FeesMainData[],action);
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