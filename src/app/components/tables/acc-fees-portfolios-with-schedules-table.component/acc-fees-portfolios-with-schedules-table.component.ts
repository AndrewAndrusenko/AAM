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
import { FeesPortfoliosWithSchedulesData } from 'src/app/models/fees-interfaces.model';
import { Subscription, filter, tap } from 'rxjs';
import { tableHeaders } from 'src/app/models/interfaces.model';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AppAccFeesPortfolioScheduleFormComponent } from '../../forms/acc-fees-portfolio-schedule-form.component/acc-fees-portfolio-schedule-form.component';
@Component({
  selector: 'acc-fees-portfolios-with-schedules-table',
  templateUrl: './acc-fees-portfolios-with-schedules-table.component.html',
  styleUrls: ['./acc-fees-portfolios-with-schedules-table.component.scss'],
  animations: [
    trigger('detailFeeExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class AppAccFeesPortfoliosWithSchedulesTableComponent  {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  private subscriptions = new Subscription()
  @Input() readOnly:boolean = false;
  @Input() portfolioname:string = null;
  @Input() id_portfolio:number = null;
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
      'fieldName': 'period_start',
      'displayName': 'Begins'
    },
    {
      'fieldName': 'period_end',
      'displayName': 'Ends'
    },
    {
      'fieldName': 'action',
      'displayName': 'Action'
    },
];
  columnsToDisplay: string [];
  columnsHeaderToDisplay: string [];
  columnsToDisplayWithExpand = [];
  expandedElement: FeesPortfoliosWithSchedulesData  | null;
  expandAllowed: boolean = true;
  dataSource: MatTableDataSource<FeesPortfoliosWithSchedulesData>;
  fullDataSource: FeesPortfoliosWithSchedulesData[];
  @ViewChild('filterALL', { static: false }) filterALL: ElementRef;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  multiFilter?: (data: any, filter: string) => boolean;
  refFeeForm : MatDialogRef<AppAccFeesPortfolioScheduleFormComponent>
  feesCodes = this.AppFeesHandlingService.feesCodes;
  objectCodes = this.AppFeesHandlingService.objectCodes;
  feeMainCodes: {value:string,name:string, desc:string,feeType:string}[];
  constructor(
    private AuthServiceS:AuthService,  
    private HandlingCommonTasksS:HandlingCommonTasksService,
    private CommonDialogsService:HadlingCommonDialogsService,
    private AppFeesHandlingService:AppFeesHandlingService,
    private dialog: MatDialog,
  ) 
    { this.columnsToDisplay=this.columnsWithHeaders.map(el=>el.fieldName);
      this.columnsHeaderToDisplay=this.columnsWithHeaders.map(el=>el.displayName);
      this.columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
      this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToFeesData')[0].elementvalue;
      this.disabledControlElements = this.accessState === 'full'? false : true;
    }
    ngOnDestroy(): void {
      this.subscriptions.unsubscribe();
    }
    ngOnInit(): void {
      this.multiFilter = (data: FeesPortfoliosWithSchedulesData, filter: string) => {
        let filter_array = filter.split(',').map(el=>[el,1]);
        this.columnsToDisplay.forEach(col=>filter_array.forEach(fil=>{
          data[col]&&fil[0].toString().toUpperCase()===(data[col]).toString().toUpperCase()? fil[1]=0:null
        }));
        return !filter || filter_array.reduce((acc,val)=>acc+Number(val[1]),0)===0;
      };
      this.subscriptions.add(
        this.AppFeesHandlingService.recieveFeesPortfoliosWithSchedulesReload().pipe(
        filter(data=>Number(data.data[0].object_id)===this.id_portfolio)
        ).subscribe(()=>this.submitQuery(false,false))
      )
      this.subscriptions.add(this.AppFeesHandlingService.recieveFeesPortfoliosWithSchedulesIsOpened().pipe(
        filter(id=>id===this.id_portfolio&&this.dataSource===undefined)
      ).subscribe(()=>{
        this.submitQuery(false,false);
        this.AppFeesHandlingService.getFeesMainData().subscribe(data=>{
          this.feeMainCodes = data
          .map(el=>{return {value:el.id.toString(),name:el.fee_code.toString(),desc: el.fee_description,feeType:el.fee_type_desc}})
          .sort((el,el1)=>el.name>el1.name? 1: el.name<el1.name? -1 : 0)
        })
      }));
    }
    updateDataTable (managementFeeData:FeesPortfoliosWithSchedulesData[]) {
      this.fullDataSource=managementFeeData;
      this.dataSource  = new MatTableDataSource(managementFeeData);
      this.dataSource.filterPredicate =this.multiFilter
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
    submitQuery (reset:boolean=false, showSnackResult:boolean=true) {
     this.AppFeesHandlingService.getFeesPortfoliosWithSchedulesData(this.id_portfolio,null).subscribe(data => {
        this.updateDataTable(data)
        showSnackResult? this.CommonDialogsService.snackResultHandler({
          name:data['name'], 
          detail:data['name'] === 'error'? data['detail'] :  formatNumber (data.length,'en-US') + ' rows'}, 'Loaded ') : null;
      });
    }
    openPortolioFeesModifyForm (action:string, element:FeesPortfoliosWithSchedulesData|{id:number,object_id:number}) { 
      this.expandAllowed=false;
      let dataToForm = structuredClone(element);
      action==='Create_Example'? dataToForm.id=null:null;
       this.refFeeForm = this.dialog.open (AppAccFeesPortfolioScheduleFormComponent,{minHeight:'30vh', width:'70vw', autoFocus: false, maxHeight: '90vh'})
      this.refFeeForm.componentInstance.action=action;
      this.refFeeForm.componentInstance.data=dataToForm;
      this.refFeeForm.componentInstance.feeCodes=this.feeMainCodes;
      this.refFeeForm.componentInstance.modal_principal_parent.subscribe(success => {
        success? this.refFeeForm.close():null;
      })
    }
    showSchedules(element:FeesPortfoliosWithSchedulesData) {
      if (this.expandAllowed) {
        this.expandedElement = this.expandedElement === element ? null : element;
        this.AppFeesHandlingService.sendFeeSheduleIsOpened(element.id_fee)
      }
      else {this.expandAllowed=true}
    }
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
      this.AppFeesHandlingService.getFeesMainWithSchedulesData().subscribe(data=>{
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
        let dataToExport =  structuredClone(data);
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
        this.HandlingCommonTasksS.exportToExcel (dataToExport,"FeeDataMainWithSchedules");  
      })
    }
}