import { Component, EventEmitter,  Input, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { filter, switchMap } from 'rxjs';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { FeesMainData, FeesPortfoliosWithSchedulesData, dFeesObject } from 'src/app/models/fees-interfaces.model';
import { AppFeesHandlingService } from 'src/app/services/fees-handling.service';
import { AppaIAccFeesSchedulesTable } from '../../tables/acc-fees-schedules-table.component/acc-fees-schedules-table.component';
// import { MatDialog, MatDialogRef } from '@angular/material/dialog';
// import { AppAccFeesSchedulesTableComponent } from '../../tables/acc-fees-main-table.component/acc-fees-main-table.component';
@Component({
  selector: 'acc-fees-portfolio-schedule-form',
  templateUrl: './acc-fees-portfolio-schedule-form.component.html',
  styleUrls: ['./acc-fees-portfolio-schedule-form.component.scss'],
})
export class AppAccFeesPortfolioScheduleFormComponent {
  FeesPortfolioForm: FormGroup;
  dataRange = new FormGroup ({
    period_start: new FormControl<Date | null>(new Date(),Validators.required),
    period_end: new FormControl<Date | null>(new Date()),
  });
  feesTypesCodes = this.AppFeesHandlingService.feesCodes;
  @Input() feeCodes: {value:string,name:string,desc:string,feeType:string}[];
  @Input() action: string;
  @Input() data: FeesPortfoliosWithSchedulesData|{id:number,object_id:number};
  @ViewChild('schedulesPort') tableSchedules:AppaIAccFeesSchedulesTable
  @Output() public modal_principal_parent = new EventEmitter();
  constructor (
    private fb:FormBuilder, 
    private CommonDialogsService:HadlingCommonDialogsService,
    private AppFeesHandlingService:AppFeesHandlingService,
  ) 
  {   
    this.FeesPortfolioForm = this.fb.group ({
      id :{value:null, disabled: false},
      fee_code:[null],
      object_id: [null, { validators:  [Validators.required]}],
      fee_type: [null],
      main_fee_object_type: {value:null, disabled: true},
      fee_description: {value:null, disabled: false},
      portfolioname: {value:null, disabled: false},
      fee_type_desc: {value:null, disabled: false},
      id_fee_main: [null, { validators:  [Validators.required]}],
      period_desc: {value:null, disabled: false},
      period_start:[null],
      period_end :[null],
    })
  }
  ngOnInit(): void {
    this.action==='View'? this.FeesPortfolioForm.disable():null;
    this.FeesPortfolioForm.patchValue(this.data);
    this.dataRange.patchValue({period_start:this.period_start.value,period_end:this.period_end.value});
  }
  ngAfterViewInit(): void {
    this.id_fee_main.value? this.tableSchedules.submitQuery(false,false) : null;
  }
  idFeeMainChange (value:string) {
    this.fee_description.patchValue(this.feeCodes[this.feeCodes.findIndex(el=>el.value===value)].desc);
    this.fee_type_desc.patchValue(this.feeCodes[this.feeCodes.findIndex(el=>el.value===value)].feeType);
    if (this.tableSchedules===undefined) {
      setTimeout(() => {
        this.tableSchedules.idFeeMain=Number(value);
        this.tableSchedules.submitQuery(false,false);
      }, 200);
    } else {
      this.tableSchedules.idFeeMain=Number(value);
      this.tableSchedules.submitQuery(false,false);
    }
  }
  snacksBox(result:{name:string,detail:string}|dFeesObject[], action?:string){
    if (result['name']=='error') {
      this.CommonDialogsService.snackResultHandler(result)
    } else {
      this.CommonDialogsService.snackResultHandler({name:'success', detail: result + ' fee schedules'}, action,undefined,false)
      this.AppFeesHandlingService.sendFeesPortfoliosWithSchedulesReload(result as dFeesObject[],action);
      this.modal_principal_parent.emit(true)
    }
  }
  updateInstrumentData(action:string){
    this.FeesPortfolioForm.updateValueAndValidity();
    let dataToUpdate = structuredClone(this.FeesPortfolioForm.value);
    dataToUpdate.period_start = new Date(this.rangeStart.value).toLocaleDateString();
    dataToUpdate.period_end = new Date(this.rangeEnd.value??'1/1/2050').toLocaleDateString();
    if (this.FeesPortfolioForm.invalid) {return}
    switch (action) {
      case 'Create_Example':
      case 'Create':
        this.AppFeesHandlingService.updatePortfoliosFeesData(dataToUpdate,'Create').subscribe(result => this.snacksBox(result,'Created'))
      break;
      case 'Edit':
        this.AppFeesHandlingService.updatePortfoliosFeesData (dataToUpdate,'Edit').subscribe(result => this.snacksBox(result,'Updated'))
      break;
      case 'Delete':
        this.CommonDialogsService.confirmDialog('Delete Action: Fee data and schedules','Delete').pipe(
          filter (isConfirmed => (isConfirmed.isConfirmed)),
          switchMap(() => this.AppFeesHandlingService.updatePortfoliosFeesData(dataToUpdate,'Delete'))
        ).subscribe(result => this.snacksBox(result,'Deleted'))
      break;
    }
  }
  get  fee_type() {return this.FeesPortfolioForm.get('fee_type')}
  get  id() {return this.FeesPortfolioForm.get('id')}
  get  main_fee_object_type () {return this.FeesPortfolioForm.get('main_fee_object_type') } 
  get  object_id () {return this.FeesPortfolioForm.get('object_id') } 
  get  fee_code () {return this.FeesPortfolioForm.get('fee_code') } 
  get  id_fee_main () {return this.FeesPortfolioForm.get('id_fee_main') } 
  get  period_start () {return this.FeesPortfolioForm.get('period_start') }
  get  period_end () {return this.FeesPortfolioForm.get('period_end') }
  get  fee_description () {return this.FeesPortfolioForm.get('fee_description') }
  get  fee_type_desc () {return this.FeesPortfolioForm.get('fee_type_desc') }
  get  portfolioname () {return this.FeesPortfolioForm.get('portfolioname') }
  get  rangeStart () {return this.dataRange.get('period_start') }
  get  rangeEnd () {return this.dataRange.get('period_end') }
}