import { Component, ElementRef, Input, SimpleChanges, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { AuthService } from 'Frontend-Angular-Src/app/services/auth.service';
import { HadlingCommonDialogsService } from 'Frontend-Angular-Src/app/services/hadling-common-dialogs.service';
import { HandlingCommonTasksService } from 'Frontend-Angular-Src/app/services/handling-common-tasks.service';
import { formatNumber } from '@angular/common';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { AppFeesHandlingService } from 'Frontend-Angular-Src/app/services/fees-handling.service';
import { FeesPortfoliosWithSchedulesData } from 'Frontend-Angular-Src/app/models/fees-interfaces.model';
import { Subscription, filter, skip, tap } from 'rxjs';
import { tableHeaders } from 'Frontend-Angular-Src/app/models/interfaces.model';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AppAccFeesPortfolioScheduleFormComponent } from '../../forms/acc-fees-portfolio-schedule-form.component/acc-fees-portfolio-schedule-form.component';
@Component({
  selector: 'acc-fees-portfolios-with-schedules-table',
  templateUrl: './acc-fees-portfolios-with-schedules-table.component.html',
  styleUrls: ['./acc-fees-portfolios-with-schedules-table.component.scss'],
  animations: [
    trigger('detailFeeExpandFPS', 
    [   state('collapsed, void', style({ height: '0px'})),
        state('expanded', style({ height: '*' })),
        transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        transition('expanded <=> void', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ])
  ],
})
export class AppAccFeesPortfoliosWithSchedulesTableComponent  {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  private subscriptions = new Subscription()
  @Input() readOnly:boolean = false;
  @Input() portfolioname:string = null;
  @Input() id_portfolio:number = null;
  @Input() onChanges:boolean = false;
  columnsWithHeaders: tableHeaders[] = [
    {
      'fieldName': 'id',
      'displayName': 'ID'
    },
    {
      'fieldName': 'portfolioname',
      'displayName': 'PrCode'
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
  multiFilter?: (data: FeesPortfoliosWithSchedulesData, filter: string) => boolean;
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
    { }
    ngOnDestroy(): void {
      this.subscriptions.unsubscribe();
    }
    ngOnInit(): void {
      this.columnsToDisplay=this.columnsWithHeaders.map(el=>el.fieldName);
      this.columnsHeaderToDisplay=this.columnsWithHeaders.map(el=>el.displayName);
      this.columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
      this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToFeesData')[0].elementvalue;
      this.disabledControlElements = this.accessState === 'full'? false : true;
      this.id_portfolio===null&&this.onChanges===false? this.submitQuery(false,false):null;
      this.multiFilter = (data: FeesPortfoliosWithSchedulesData, filter: string) => {
        let filter_array = filter.split(',').map(el=>[el,1]);
        this.columnsToDisplay.forEach(col=>filter_array.forEach(fil=>{
          data[col]&&fil[0].toString().toUpperCase()===(data[col]).toString().toUpperCase()? fil[1]=0:null
        }));
        return !filter || filter_array.reduce((acc,val)=>acc+Number(val[1]),0)===0;
      };
      this.subscriptions.add(
        this.AppFeesHandlingService.recieveFeesPortfoliosWithSchedulesReload().pipe(
          filter(data=>Number(data.data[0].object_id)===this.id_portfolio),
          tap(()=>console.log('113'))
        ).subscribe(()=>this.submitQuery(false,false))
      )
    }
    ngAfterViewInit(): void {
      this.subscriptions.add(this.AppFeesHandlingService.recieveFeesPortfoliosWithSchedulesIsOpened().pipe(
        skip(1),
        filter(sub=>sub[0].id===this.id_portfolio&&(this.dataSource===undefined||sub[0].rewriteDS===true)),
      ).subscribe(()=>{
        console.log('recieveFeesPortfoliosWithSchedulesIsOpened',);
        this.submitQuery(false,false);
        this.AppFeesHandlingService.getFeesMainData().subscribe(data=>{
          this.feeMainCodes = data
          .map(el=>{return {value:el.id.toString(),name:el.fee_code.toString(),desc: el.fee_description,feeType:el.fee_type_desc}})
          .sort((el,el1)=>el.name>el1.name? 1: el.name<el1.name? -1 : 0)
        })
      }));
    }
    ngOnChanges(changes: SimpleChanges): void {
      this.onChanges&&this.id_portfolio? this.submitQuery(false,false):null;
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
        let dataToExport =  structuredClone(this.dataSource.data);
        this.HandlingCommonTasksS.exportToExcel (dataToExport,"FeeDataMainWithSchedules",['id_fee',	'id_fee_period',	'id'	,'object_id'	,'id_fee_main',		'idportfolio'],['period_start','period_end','created','modified']);  
    }
}
	
