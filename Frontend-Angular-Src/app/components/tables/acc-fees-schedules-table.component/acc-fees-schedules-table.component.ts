import {Component, ViewChild, Input, ChangeDetectionStrategy, ElementRef} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {Subscription, filter, tap,} from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {tableHeaders } from 'Frontend-Angular-Src/app/models/interfaces.model';
import {formatNumber } from '@angular/common';
import {HadlingCommonDialogsService } from 'Frontend-Angular-Src/app/services/hadling-common-dialogs.service';
import {HandlingCommonTasksService } from 'Frontend-Angular-Src/app/services/handling-common-tasks.service';
import {AuthService } from 'Frontend-Angular-Src/app/services/auth.service';
import {AppFeesHandlingService } from 'Frontend-Angular-Src/app/services/fees-handling.service';
import {FeesSchedulesData } from 'Frontend-Angular-Src/app/models/fees-interfaces.model';
import {AppAccFeesScheduleFormComponent } from '../../forms/acc-fees-schedule-form.component/acc-fees-schedule-form.component';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
@Component({
  selector: 'acc-fees-schedules-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './acc-fees-schedules-table.component.html',
  styleUrls: ['./acc-fees-schedules-table.component.scss'],
})
export class AppaIAccFeesSchedulesTable {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  private subscriptions = new Subscription()
  @Input() readOnly:boolean = false;
  @Input() idFeeMain:number;
  columnsWithHeaders: tableHeaders[] = [
    {
      "fieldName": "idfee_scedule",
      "displayName": "ID"
    },
    {
      "fieldName": "feevalue",
      "displayName": "Rate"
    },
    {
      "fieldName": "schedule_range",
      "displayName": "Range"
    },
    {
      "fieldName": "range_parameter",
      "displayName": "Range_Param"
    },
    {
      "fieldName": "calculation_period",
      "displayName": "Calc Period"
    },
    {
      "fieldName": "deduction_period",
      "displayName": "Deduction Period"
    },
    {
      "fieldName": "highwatermark",
      "displayName": "HWM"
    },
    {
      "fieldName": "pf_hurdle",
      "displayName": "Hurdle"
    },
    {
      "fieldName": "below_ranges_calc_type",
      "displayName": "Low_Ranges"
    },
    {
      "fieldName": "action",
      "displayName": "Action"
    }
  ]
  columnsToDisplay: string [];
  columnsHeaderToDisplay: string [];
  dataSource: MatTableDataSource<FeesSchedulesData>;
  fullDataSource: FeesSchedulesData[];
  @ViewChild('filterALL', { static: false }) filterALL: ElementRef;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  multiFilter?: (data: FeesSchedulesData, filter: string) => boolean;
  refFeeForm : MatDialogRef<AppAccFeesScheduleFormComponent>

  constructor(
    private AuthServiceS:AuthService,  
    private HandlingCommonTasksS:HandlingCommonTasksService,
    private CommonDialogsService:HadlingCommonDialogsService,
    private AppFeesHandlingService:AppFeesHandlingService,
    private dialog: MatDialog,
  ) {
    this.columnsToDisplay=this.columnsWithHeaders.map(el=>el.fieldName);
    this.columnsHeaderToDisplay=this.columnsWithHeaders.map(el=>el.displayName);
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToFeesData')[0].elementvalue;
  }
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  ngOnInit(): void {
    this.disabledControlElements = this.accessState === 'full'&&this.readOnly===false? false : true;
    this.multiFilter = (data: FeesSchedulesData, filter: string) => {
      let filter_array = filter.split(',').map(el=>[el,1]);
      this.columnsToDisplay.forEach(col=>filter_array.forEach(fil=>{
        data[col]&&fil[0].toString().toUpperCase()===(data[col]).toString().toUpperCase()? fil[1]=0:null
      })
        );
      return !filter || filter_array.reduce((acc,val)=>acc+Number(val[1]),0)===0;
    };
    this.subscriptions.add(this.AppFeesHandlingService.getFeeShedulessDataReload().pipe(
      filter(data=>Number(data.data[0].id_fee_main)===this.idFeeMain)
      ).subscribe((data)=>this.updateDataSource(data)));
      this.subscriptions.add(this.AppFeesHandlingService.getFeeSheduleIsOpened().pipe(
      filter(id=>id===this.idFeeMain&&this.dataSource===undefined)
    ).subscribe(()=>this.submitQuery(false,false)));
  }
  updateDataTable (managementFeeData:FeesSchedulesData[]) {
    this.fullDataSource=managementFeeData;
    this.dataSource  = new MatTableDataSource(managementFeeData);
    this.dataSource.filterPredicate =this.multiFilter
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  updateDataSource (newData:{data:FeesSchedulesData[],action:string}) {
    let index =  this.dataSource.data.findIndex(elem=>elem.idfee_scedule===newData.data[0].idfee_scedule)
    switch (newData.action) {
      case 'Deleted':
        this.dataSource.data.splice(index,1)
      break;
      case 'Created':
        this.dataSource.data.unshift(newData.data[0])
      break;
      case 'Updated':
        this.dataSource.data[index] = {...newData.data[0]}
      break;
    }
   this.dataSource.paginator = this.paginator;
   this.dataSource.sort = this.sort;
  }
  submitQuery (reset:boolean=false, showSnackResult:boolean=true) {
    this.AppFeesHandlingService.getFeesSchedulesData(Number(this.idFeeMain)).subscribe(data => {
      this.updateDataTable(data)
      showSnackResult? this.CommonDialogsService.snackResultHandler({
        name:data['name'], 
        detail:data['name'] === 'error'? data['detail'] :  formatNumber (data.length,'en-US') + ' rows'}, 'Loaded ') : null;
    });
  }
  openFeeModifyForm(action: string,element: FeesSchedulesData) {
    let dataToForm = structuredClone(element);
    action==='Create_Example'? dataToForm.idfee_scedule=null:null;
    this.refFeeForm = this.dialog.open (AppAccFeesScheduleFormComponent,{minHeight:'30vh', width:'70vw', autoFocus: false, maxHeight: '90vh'})
    action==='Create'? this.refFeeForm.componentInstance.id_fee_main.patchValue(this.idFeeMain):null;
    this.refFeeForm.componentInstance.action=action;
    this.refFeeForm.componentInstance.data=dataToForm;
    this.refFeeForm.componentInstance.modal_principal_parent.subscribe(success => {
      success? this.refFeeForm.close():null;
    })
  }
  updateFilter (el: string) {
    this.filterALL.nativeElement.value = this.filterALL.nativeElement.value + el+',';
    this.dataSource.filter = this.filterALL.nativeElement.value.slice(0,-1).trim().toLowerCase();
    (this.dataSource.paginator)? this.dataSource.paginator.firstPage() : null;
  }
  applyFilter(event: KeyboardEvent) {
    const filterValue = (event.target as HTMLInputElement).value 
    this.dataSource.filter = filterValue.trim().toLowerCase();
    this.dataSource.paginator? this.dataSource.paginator.firstPage():null;
  }
  clearFilter (input:HTMLInputElement) {
    input.value=''
    this.dataSource.filter = ''
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage()}
  }
  exportToExcel() {
    let dataTypes =  {
      id :'number',
      id_object :'number',
      fee_object_type:'number',
      fee_amount:'number', 
      fee_date:'Date', 
      calculation_date :'Date', 
      b_transaction_date :'Date', 
      id_b_entry:'number', 
      fee_rate:'number', 
      calculation_base:'number', 
      id_fee_main:'number', 
      fee_type:'number',
      idfee_scedule :'number', 
      fee_type_value :'number',
      feevalue :'number',
      calculation_period :'number', 
      deduction_period :'number',
      range_parameter:'string', 
      below_ranges_calc_type:'number', 
      pf_hurdle:'number',
      highwatermark:'boolean'
    }
    let dataToExport =  structuredClone(this.fullDataSource);
    dataToExport.map(el=>{
      Object.keys(el).forEach(key=>{
        switch (true==true) {
          case el[key]&&dataTypes[key]==='number': return el[key]=Number(el[key])
          case el[key]&&dataTypes[key]==='Date': return el[key]=new Date(el[key])
          default: return el[key]=el[key]
        }
      })
      return el;
    });
    this.HandlingCommonTasksS.exportToExcel (dataToExport,"FeeScheduleData");  
  }
}
