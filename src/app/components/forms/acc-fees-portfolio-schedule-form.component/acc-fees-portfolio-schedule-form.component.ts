import { Component, EventEmitter,  Input, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { filter, switchMap } from 'rxjs';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { FeesMainData } from 'src/app/models/fees-interfaces.model';
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
  feesTypesCodes = this.AppFeesHandlingService.feesCodes;
  // FeesMainTable :MatDialogRef<AppAccFeesSchedulesTableComponent>
  @Input() feeCodes: {value:string,name:string,desc:string,feeType:string}[];
  @Input() action: string;
  @Input() data: FeesMainData;
  @ViewChild('schedulesPort') tableSchedules:AppaIAccFeesSchedulesTable
  @Output() public modal_principal_parent = new EventEmitter();
  constructor (
    private fb:FormBuilder, 
    // private dialog:MatDialog,
    private CommonDialogsService:HadlingCommonDialogsService,
    private AppFeesHandlingService:AppFeesHandlingService,
  ) 
  {   
    this.FeesPortfolioForm = this.fb.group ({
      id :{value:null, disabled: false},
      fee_code:[null, { validators:  [Validators.required]}],
      object_id: [null],
      fee_type: [null],
      main_fee_object_type: {value:null, disabled: true},
      fee_description: {value:null, disabled: false},
      portfolioname: {value:null, disabled: false},
      fee_type_desc: {value:null, disabled: false},
      id_fee_main: [null, { validators:  [Validators.required]}],
      period_desc: {value:null, disabled: false},
      period_start:[null, { validators:  [Validators.required]}],
      period_end :[null, { validators:  [Validators.required]}],
    })
  }
  ngOnInit(): void {
    this.action==='View'? this.FeesPortfolioForm.disable():null;
    console.log('f data',this.data);
    this.FeesPortfolioForm.patchValue(this.data);
  }
  ngAfterViewInit(): void {
    this.tableSchedules.submitQuery(false,false);
  }
  idFeeMainChange (value:string) {
    this.fee_description.patchValue(this.feeCodes[this.feeCodes.findIndex(el=>el.value===value)].desc);
    this.fee_type_desc.patchValue(this.feeCodes[this.feeCodes.findIndex(el=>el.value===value)].feeType);
    this.tableSchedules.idFeeMain=Number(value);
    this.tableSchedules.submitQuery(false,false);
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
    this.FeesPortfolioForm.updateValueAndValidity();
    if (this.FeesPortfolioForm.invalid) {return}
    switch (action) {
      case 'Create_Example':
      case 'Create':
        this.AppFeesHandlingService.updatePortfoliosFeesData(this.FeesPortfolioForm.value,'Create').subscribe(result => this.snacksBox(result,'Created'))
      break;
      case 'Edit':
        console.log('updatePortfoliosFeesData',);
        this.AppFeesHandlingService.updatePortfoliosFeesData (this.FeesPortfolioForm.value,'Edit').subscribe(result => this.snacksBox(result,'Updated'))
      break;
      case 'Delete':
        this.CommonDialogsService.confirmDialog('Delete Action: Fee data and schedules','Delete').pipe(
          filter (isConfirmed => (isConfirmed.isConfirmed)),
          switchMap(() => this.AppFeesHandlingService.deleteFeesSchedulesCascade(this.id.value)),
          switchMap(() => this.AppFeesHandlingService.updateFeesMainData(this.FeesPortfolioForm.value,'Delete'))
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
}