import {Component, ViewChild, Input, ChangeDetectionStrategy, ElementRef} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {Subscription, from,  of, switchMap, tap } from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {FeesTransactions,tableHeaders } from 'src/app/models/intefaces.model';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {MatChipInputEvent} from '@angular/material/chips';
import {AbstractControl, FormBuilder,  FormGroup, FormControl } from '@angular/forms';
import {formatNumber } from '@angular/common';
import {HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import {HandlingCommonTasksService } from 'src/app/services/handling-common-tasks.service';
import {AuthService } from 'src/app/services/auth.service';
import {AppInvestmentDataServiceService } from 'src/app/services/investment-data.service.service';
import {indexDBService } from 'src/app/services/indexDB.service';
import { AppFeesHandlingService } from 'src/app/services/fees-handling.service';
import { HandlingTableSelectionService } from 'src/app/services/handling-table-selection.service';
import { SelectionModel } from '@angular/cdk/collections';
import { number } from 'echarts';
@Component({
  selector: 'acc-fees-processing-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './acc-fees-processing-table.component.html',
  styleUrls: ['./acc-fees-processing-table.component.scss'],
})
export class AppaIAccFeesProcessingTableComponent {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  private subscriptions = new Subscription()
  @Input() readOnly:boolean = false;
  columnsWithHeaders: tableHeaders[] = [
    {fieldName:'select',displayName:''},
    {fieldName:'id',displayName:'ID'},
    {fieldName:'fee_date',displayName:'Date'},
    {fieldName:'portfolioname',displayName:'Code'},
    {fieldName:'fee_amount',displayName:'Fee Amounnt'},
    {fieldName:'fee_rate',displayName:'Rate'},
    {fieldName:'calculation_base',displayName:'NPV'},
    {fieldName:'calculation_date',displayName:'Generated'},
    {fieldName:'b_transaction_date',displayName:'Entry Date'},
    {fieldName:'id_b_entry',displayName:'ID Entry'},
    {fieldName:'id_fee_main',displayName:'ID Fee'},
    // {fieldName:'fee_code',displayName:'Fee Type'},
    {fieldName:'accountId',displayName:'idAcc'},
    {fieldName:'id_object',displayName:'idPort'},
    {fieldName:'startPeriod',displayName:'Start'},
    {fieldName:'endPeriod',displayName:'End'},
  ];
  columnsToDisplay: string [];
  columnsHeaderToDisplay: string [];
  dataSource: MatTableDataSource<FeesTransactions>;
  fullDataSource: FeesTransactions[];
  selection  = new SelectionModel<FeesTransactions> (true,[])
  @ViewChild('filterALL', { static: false }) filterALL: ElementRef;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  dataRange = new FormGroup ({
    dateRangeStart: new FormControl<Date | null>(new Date()),
    dateRangeEnd: new FormControl<Date | null>(new Date()),
  });
  searchParametersFG: FormGroup;
  multiFilter?: (data: any, filter: string) => boolean;
  mp_strategies_list: string[]=[];
  portfolios: Array<string> = ['ClearAll'];
  currencySymbol: string = '$';
  profitTaxRate:number;
  detailedView:boolean = false;
  selectedRowID: number;
  selectedRowIndex: number;
  statusDetails:{};
  statusDetailsHeader:string='';
  constructor(
    private AuthServiceS:AuthService,  
    private InvestmentDataService:AppInvestmentDataServiceService, 
    private HandlingCommonTasksS:HandlingCommonTasksService,
    private CommonDialogsService:HadlingCommonDialogsService,
    private AppFeesHandlingService:AppFeesHandlingService,
    private indexDBServiceS:indexDBService,
    private SelectionService:HandlingTableSelectionService,
    private fb:FormBuilder, 
  ) {
    this.columnsToDisplay=this.columnsWithHeaders.map(el=>el.fieldName);
    this.columnsHeaderToDisplay=this.columnsWithHeaders.map(el=>el.displayName);
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToTradesData')[0].elementvalue;
    this.disabledControlElements = this.accessState === 'full'? false : true;
    this.dateRangeStart.value.setMonth(this.dateRangeStart.value.getMonth()-1);
    this.searchParametersFG = this.fb.group ({
      p_portfolios_list:  [],
      MP:null,
      p_report_date_start:null,
      p_report_date_end:null,
    });
  }
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  ngOnInit(): void {
    this.AppFeesHandlingService.getProfitTax(new Date().toDateString()).subscribe(data=>this.profitTaxRate=data[0].rate)
    this.indexDBServiceS.getIndexDBStaticTables('getModelPortfolios').then ((data)=>{
      this.mp_strategies_list = data['data']
    })
    this.submitQuery(false,false);  
    this.multiFilter = (data: FeesTransactions, filter: string) => {
      let filter_array = filter.split(',').map(el=>[el,1]);
      this.columnsToDisplay.forEach(col=>filter_array.forEach(fil=>{
        data[col]&&fil[0].toString().toUpperCase()===(data[col]).toString().toUpperCase()? fil[1]=0:null
      })
        );
      return !filter || filter_array.reduce((acc,val)=>acc+Number(val[1]),0)===0;
    };
    this.subscriptions.add(this.AppFeesHandlingService.getCreatedAccounting().subscribe(createdTransaction=>{
      this.statusDetailsHeader='Created Management Fees details'
      this.statusDetails={...createdTransaction};
    }))
  }
  resetSearchForm () {
    this.searchParametersFG.reset();
    this.portfolios=['ClearAll'];
  }
  setPortfoliosList(e:any) {
    this.InvestmentDataService.getPortfoliosListForMP(e.value,'getPortfoliosByMP_StrtgyID').subscribe(data=>{
      this.portfolios=['ClearAll',...data]
      this.filterALL.nativeElement.value = e.value;
    })
  }
  updateDataTable (managementFeeData:FeesTransactions[]) {
    this.fullDataSource=managementFeeData;
    this.dataSource  = new MatTableDataSource(managementFeeData);
    this.dataSource.filterPredicate =this.multiFilter
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  submitQuery ( reset:boolean=false, showSnackResult:boolean=true) {
    let searchObj = reset?  {} : this.searchParametersFG.value;
    this.dataSource?.data? this.dataSource.data = null : null;
    searchObj.p_report_date_start = new Date (this.dateRangeStart.value).toLocaleDateString();
    searchObj.p_report_date_end = this.dateRangeEnd.value? new Date (this.dateRangeEnd.value).toLocaleDateString(): new Date().toLocaleDateString();
    of(this.portfolios.length).pipe(
      switchMap(portLength => portLength===1? this.InvestmentDataService.getPortfoliosListForMP('All','getPortfoliosByMP_StrtgyID'):from([[...this.portfolios]])),
      tap(ports=>searchObj.p_portfolios_list = ports.map(el=>el.toUpperCase())),
      switchMap(()=>this.AppFeesHandlingService.getFeesTransactions(searchObj))
    ).subscribe(data => {
      this.updateDataTable(data)
      showSnackResult? this.CommonDialogsService.snackResultHandler({
        name:data['name'], 
        detail:data['name'] === 'error'? data['detail'] :  formatNumber (data.length,'en-US') + ' rows'}, 'Loaded ') : null;
    });
  }
  showCalcDetails (details:boolean) {
    this.dataSource.data = this.fullDataSource.filter(el=>details? el.calculation_base === null:el.calculation_base !== null)
  }
  deleteAccounting () {
    
  }
  createAccounting () {
    let feesToProcess = this.selection.selected
    if (this.isAllSelected() === false) {
      let portfolios = [...feesToProcess.map(el=>el.portfolioname)]
      feesToProcess = [...feesToProcess,...this.dataSource.data.filter(el=>portfolios.includes(el.portfolioname)&&el.id>0)]
    }  
    this.AppFeesHandlingService.createAccountingForManagementFees(feesToProcess,this.profitTaxRate)
    this.selection.clear();
  }
  deleteCalculation () {
    let feesToProcess = this.selection.selected
    if (this.isAllSelected() === false) {
      let portfolios = [...feesToProcess.map(el=>el.portfolioname)]
      feesToProcess = [...feesToProcess,...this.dataSource.data.filter(el=>portfolios.includes(el.portfolioname)&&el.id>0)]
    } 
    this.AppFeesHandlingService.deleteFeesCalculation(feesToProcess.map(el=>Number(el.id))).subscribe(data=>{
      this.CommonDialogsService.snackResultHandler({
        name:data['name'], 
        detail:data['name'] === 'error'? data['detail'] :  formatNumber (data.length,'en-US') + ' rows'}, 'Deleted '
      );
      data['name'] !== 'error'? this.submitQuery(false,false):null;
    })
    this.selection.clear();

  }
  changedValueofChip (value:string, chipArray:string[]) {
    chipArray[chipArray.length-1] === 'ClearAll'? chipArray.push(value) : chipArray[chipArray.length-1] = value
  }
  add(event: MatChipInputEvent,chipArray:string[]): any[] {
    const value = (event.value || '').trim();
    const valueArray = event.value.split(',');
    (value)? chipArray = [...chipArray,...valueArray] : null;
    event.chipInput!.clear();
    return chipArray;
  }
  remove(account: string, chipArray:string[],control:AbstractControl): void {
    const index = chipArray.indexOf(account);
    (index >= 0)? chipArray.splice(index, 1) : null;
  }
  clearAll(event, chipArray:string[],control:AbstractControl) : string [] {
    if (event.target.textContent.trim() === 'ClearAll') {
      chipArray = ['ClearAll'];
    };
    return chipArray;
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
  isAllSelected() { return this.SelectionService.isAllSelected(this.dataSource, this.selection)} 
  toggleAllRows(forceSelectAll:boolean=false) { 
    return this.SelectionService.toggleAllRows(this.dataSource, this.selection,forceSelectAll)
  } 
  checkboxLabel(row?: FeesTransactions): string {
    return this.SelectionService.checkboxLabel(this.dataSource, this.selection, row)
  }
  keyDownEvent(event:_KeyboardEvent) {
    switch (event.code) {
      case 'Space':
        this.selectItem()
      break;
      case 'ArrowDown':
        this.rowsMoveDown()
      break;
      case 'ArrowUp':
        this.rowsMoveUp()
      break;
    }
  }
  highlight(row){
    this.selectedRowIndex = this.dataSource.data.findIndex(el=>el.id===row.id);
    this.selectedRowID = row.id;
  }
  selectItem (row?) {
    this.selection.toggle(row? row: this.dataSource.data[this.selectedRowIndex])
  }
  rowsMoveDown() {
    this.selectedRowIndex =this.selectedRowIndex+1
    this.selectedRowID = this.dataSource.data[this.selectedRowIndex].id
  }
  rowsMoveUp () {
    this.selectedRowIndex =this.selectedRowIndex-1
    this.selectedRowID = this.dataSource.data[this.selectedRowIndex].id
  }
  // getTotals (col:string) {
  //   return (this.dataSource&&this.dataSource.data)?  this.dataSource.filteredData.map(el => el[col]).reduce((acc, value) => acc + Number(value), 0):0;
  // }
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
   get  idportfolios () {return this.searchParametersFG.get('p_portfolios_list') } 
  get  dateRangeStart () {return this.dataRange.get('dateRangeStart') } 
  get  dateRangeEnd () {return this.dataRange.get('dateRangeEnd') } 
  get  dataRangeSF () {return this.searchParametersFG.get('dataRangeSF') } 
}