import { Component,  EventEmitter,  Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { filter, switchMap } from 'rxjs';
import { HadlingCommonDialogsService } from 'Frontend-Angular-Src/app/services/hadling-common-dialogs.service';
import { FeesSchedulesData } from 'Frontend-Angular-Src/app/models/fees-interfaces.model';
import { AppFeesHandlingService } from 'Frontend-Angular-Src/app/services/fees-handling.service';

@Component({
  selector: 'acc-fees-schedule-form',
  templateUrl: './acc-fees-schedule-form.component.html',
  styleUrls: ['./acc-fees-schedule-form.component.scss'],
})
export class AppAccFeesScheduleFormComponent {
  public FeesSchedulesForm: FormGroup;
  @Input() action: string;
  @Input() data: FeesSchedulesData;
  @Output() public modal_principal_parent = new EventEmitter();
  templateStructureAT = {
   1 : {
    placeholders: {couponamount:'Coupon Amount',couponrate: "Coupon Rate" },
    requiredFileds: ['couponrate']
   },
   2 : {
    placeholders: {couponamount:'Coupon Amount',couponrate: "Coupon Rate" },
    requiredFileds: ['couponrate']
  },
  3 : {
    placeholders: {couponamount:'Amortization Amount',couponrate: "Amortization Rate" },
    requiredFileds: ['couponrate']
   },
   4 : {
    placeholders: {couponamount:'Coupon Amount',couponrate: "Coupon Rate" },
    requiredFileds: []
   },
   5 : {
    placeholders: {couponamount:'Dividend Amount' },
    requiredFileds: []
   },
   6 : {
    placeholders: {couponamount:'Offerta Amount',couponrate: "Offerta Rate" },
    requiredFileds: []
   },
   7 : {
    placeholders: {couponamount:'Offerta Amount',couponrate: "Offerta Rate" },
    requiredFileds: []
   },
  } 
  constructor (
    private fb:FormBuilder, 
    private CommonDialogsService:HadlingCommonDialogsService,
    private AppFeesHandlingService:AppFeesHandlingService,
  ) 
  { 
    this.FeesSchedulesForm = this.fb.group ({
      idfee_scedule :[null], 
      fee_type_value :[null, { validators:  [Validators.required]}],
      feevalue :[null, { validators:  [Validators.required]}],
      calculation_period :[null], 
      deduction_period :[null],
      schedule_range: [null],
      schedule_range_max: [null, { validators:  [Validators.required]}],
      schedule_range_min: [null, { validators:  [Validators.required]}],
      range_parameter:[null, { validators:  [Validators.required]}], 
      id_fee_main:[null], 
      pf_hurdle:{value:null, disabled:true},
      highwatermark:[null]
    })
   }
  ngOnInit(): void {
    this.action==='View'? this.FeesSchedulesForm.disable():null;
    this.FeesSchedulesForm.patchValue(this.data);
    if (this.action!=='Create') {
      this.schedule_range_min.patchValue(this.schedule_range.value.split(',')[0].slice(1) )
      this.schedule_range_max.patchValue(this.schedule_range.value.split(',')[1].slice(0,-1))
    }
  }
  snacksBox(result:FeesSchedulesData[], action?:string){
    if (result['name']=='error') {
      this.CommonDialogsService.snackResultHandler(result)
    } else {
      this.CommonDialogsService.snackResultHandler({name:'success', detail: result.length + ' instrument details'}, action,undefined,false)
      this.AppFeesHandlingService.sendFeeShedulessDataReload(result,action);
      this.modal_principal_parent.emit(true)
    }
  }
  updateScheduleData(action:string){
    this.FeesSchedulesForm.updateValueAndValidity();
    this.schedule_range.patchValue('['+this.schedule_range_min.value+','+this.schedule_range_max.value+']')
    this.pf_hurdle.enable();
    if (this.FeesSchedulesForm.invalid) {return}
    switch (action) {
      case 'Create_Example':
      case 'Create':
        this.AppFeesHandlingService.updateFeesScheduleData(this.FeesSchedulesForm.value,'Create').subscribe(result => this.snacksBox(result,'Created'))
      break;
      case 'Edit':
        this.AppFeesHandlingService.updateFeesScheduleData (this.FeesSchedulesForm.value,'Edit').subscribe(result => this.snacksBox(result,'Updated'))
      break;
      case 'Delete':
        this.CommonDialogsService.confirmDialog('Delete Action: Fee data and schedules','Delete').pipe(
          filter (isConfirmed => (isConfirmed.isConfirmed)),
          switchMap(() => this.AppFeesHandlingService.updateFeesScheduleData(this.FeesSchedulesForm.value,'Delete'))
        ).subscribe(result => this.snacksBox(result,'Deleted'))
      break;
    }
  }
  get  fee_type_value() {return this.FeesSchedulesForm.get('fee_type_value')}
  get  id_fee_main() {return this.FeesSchedulesForm.get('id_fee_main')}
  get  idfee_scedule() {return this.FeesSchedulesForm.get('idfee_scedule')}
  get  feevalue () {return this.FeesSchedulesForm.get('feevalue') } 
  get  calculation_period () {return this.FeesSchedulesForm.get('calculation_period') } 
  get  deduction_period () {return this.FeesSchedulesForm.get('deduction_period') } 
  get  schedule_range () {return this.FeesSchedulesForm.get('schedule_range') } 
  get  schedule_range_min () {return this.FeesSchedulesForm.get('schedule_range_min') } 
  get  schedule_range_max () {return this.FeesSchedulesForm.get('schedule_range_max') } 
  get  range_parameter () {return this.FeesSchedulesForm.get('range_parameter') }
  get  pf_hurdle () {return this.FeesSchedulesForm.get('pf_hurdle') }
  get  highwatermark () {return this.FeesSchedulesForm.get('highwatermark') }
}