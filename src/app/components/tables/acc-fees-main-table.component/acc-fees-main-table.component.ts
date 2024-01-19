import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { AuthService } from 'src/app/services/auth.service';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { HandlingCommonTasksService } from 'src/app/services/handling-common-tasks.service';
import { formatNumber } from '@angular/common';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { AppFeesHandlingService } from 'src/app/services/fees-handling.service';
import { FeesMainData, FeesSchedulesData } from 'src/app/models/fees-intefaces.model';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { AppAccountingService } from 'src/app/services/accounting.service';
import { Subscription } from 'rxjs';
import { tableHeaders } from 'src/app/models/intefaces.model';
import { AppAccFeesMainFormComponent } from '../../forms/acc-fees-main-form.component/acc-fees-main-form.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
@Component({
  selector: 'acc-fees-main-table',
  templateUrl: './acc-fees-main-table.component.html',
  styleUrls: ['./acc-fees-main-table.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class AppAccFeesSchedulesTableComponent  {
  firstForAccountingDate: Date;


  accessState: string = 'none';
  disabledControlElements: boolean = false;
  private subscriptions = new Subscription()
  @Input() readOnly:boolean = false;
  columnsWithHeaders: tableHeaders[] = [
      {
        'fieldName': 'id',
        'displayName': 'ID'
      },
      {
        'fieldName': 'fee_code',
        'displayName': 'Code_ID'
      },
      {
        'fieldName': 'fee_type_desc',
        'displayName': 'Type'
      },
      {
        'fieldName': 'fee_object_desc',
        'displayName': 'Fee_Object'
      },
      {
        'fieldName': 'fee_description',
        'displayName': 'Description'
      },
      {
        'fieldName': 'fee_type',
        'displayName': 'Type_ID'
      },
      {
        'fieldName': 'action',
        'displayName': 'Action'
      }
    
  ];
  columnsToDisplay: string [];
  columnsHeaderToDisplay: string [];
  columnsToDisplayWithExpand = [];
  expandedElement: FeesMainData  | null;
  expandAllowed: boolean = true;
  dataSource: MatTableDataSource<FeesMainData>;
  fullDataSource: FeesMainData[];
  @ViewChild('filterALL', { static: false }) filterALL: ElementRef;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
/*   dataRange = new FormGroup ({
    dateRangeStart: new FormControl<Date | null>(new Date()),
    dateRangeEnd: new FormControl<Date | null>(new Date()),
  });
  searchParametersFG: FormGroup; */
  multiFilter?: (data: any, filter: string) => boolean;
  refFeeForm : MatDialogRef<AppAccFeesMainFormComponent>
  feesCodes = ['','Management Fee', 'Performance Fee']
  objectCodes = ['','Portfolio', 'Account']
  constructor(
    private AuthServiceS:AuthService,  
    private HandlingCommonTasksS:HandlingCommonTasksService,
    private CommonDialogsService:HadlingCommonDialogsService,
    private AppFeesHandlingService:AppFeesHandlingService,
    private AccountingDataService:AppAccountingService, 
    private dialog: MatDialog,

  ) 
    {
      this.columnsToDisplay=this.columnsWithHeaders.map(el=>el.fieldName);
      this.columnsHeaderToDisplay=this.columnsWithHeaders.map(el=>el.displayName);
      this.columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
      this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToFeesData')[0].elementvalue;
      this.disabledControlElements = this.accessState === 'full'? false : true;
      this.AccountingDataService.GetbParamsgfirstOpenedDate('GetbParamsgfirstOpenedDate').subscribe(data => this.firstForAccountingDate = data[0].FirstOpenedDate);
 /*      this.searchParametersFG = this.fb.group ({
        p_report_date_start:null,
        p_report_date_end:null,
      }) */
      this.submitQuery(false,false)
    }
    ngOnDestroy(): void {
      this.subscriptions.unsubscribe();
    }
    ngOnInit(): void {
      this.multiFilter = (data: FeesMainData, filter: string) => {
        let filter_array = filter.split(',').map(el=>[el,1]);
        this.columnsToDisplay.forEach(col=>filter_array.forEach(fil=>{
          data[col]&&fil[0].toString().toUpperCase()===(data[col]).toString().toUpperCase()? fil[1]=0:null
        }));
        return !filter || filter_array.reduce((acc,val)=>acc+Number(val[1]),0)===0;
      };
      this.subscriptions.add(this.AppFeesHandlingService.getFeesMainDataReload()
      .subscribe((data)=>this.updateDataSource(data)));
    }
    updateDataSource (newData:{data:FeesMainData[],action:string}) {
      newData.data[0].fee_type_desc = this.feesCodes[(newData.data[0].fee_type)]
      newData.data[0].fee_object_desc = this.objectCodes[newData.data[0].fee_object_type]
      let index =  this.dataSource.data.findIndex(elem=>elem.id===newData.data[0].id)
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
    updateDataTable (managementFeeData:FeesMainData[]) {
      this.fullDataSource=managementFeeData;
      this.dataSource  = new MatTableDataSource(managementFeeData);
      this.dataSource.filterPredicate =this.multiFilter
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
    submitQuery ( reset:boolean=false, showSnackResult:boolean=true) {
/*       let searchObj = reset?  {} : this.searchParametersFG.value;
      this.dataSource?.data? this.dataSource.data = null : null;
      searchObj.p_report_date_start = new Date (this.dateRangeStart.value).toLocaleDateString();
      searchObj.p_report_date_end = this.dateRangeEnd.value? new Date (this.dateRangeEnd.value).toLocaleDateString(): new Date().toLocaleDateString(); */
     this.AppFeesHandlingService.getFeesMainData().subscribe(data => {
        this.updateDataTable(data)
        showSnackResult? this.CommonDialogsService.snackResultHandler({
          name:data['name'], 
          detail:data['name'] === 'error'? data['detail'] :  formatNumber (data.length,'en-US') + ' rows'}, 'Loaded ') : null;
      });
    }
    openFeeModifyForm (action:string, element:FeesMainData) { 
      action==='Create_Example'? element.id=null:null;
      this.refFeeForm = this.dialog.open (AppAccFeesMainFormComponent,{minHeight:'30vh', width:'70vw', autoFocus: false, maxHeight: '90vh'})
      this.refFeeForm.componentInstance.action=action;
      this.refFeeForm.componentInstance.data=element;
      this.refFeeForm.componentInstance.modal_principal_parent.subscribe(success => {
        success? this.refFeeForm.close():null;
      })
    }
    showSchedules(element:FeesMainData) {
      if (this.expandAllowed) {
        this.expandedElement = this.expandedElement === element ? null : element;
        this.AppFeesHandlingService.sendFeeSheduleIsOpened(element.id)
      }
      else {this.expandAllowed=true}
    }
/*     resetSearchForm () {
      this.searchParametersFG.reset();
      this.portfolios=['ClearAll'];
    } */
    updateFilter (el: any) {
      this.filterALL.nativeElement.value = this.filterALL.nativeElement.value + el+',';
      this.dataSource.filter = this.filterALL.nativeElement.value.slice(0,-1).trim().toLowerCase();
      (this.dataSource.paginator)? this.dataSource.paginator.firstPage() : null;
    }
    applyFilter(event: any) {
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
        fee_type:'number'
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
      this.HandlingCommonTasksS.exportToExcel (dataToExport,"processingFeeData");  
    }
 /*    get  idportfolios () {return this.searchParametersFG.get('p_portfolios_list') } 
    get  dateRangeStart () {return this.dataRange.get('dateRangeStart') } 
    get  dateRangeEnd () {return this.dataRange.get('dateRangeEnd') }  */
}