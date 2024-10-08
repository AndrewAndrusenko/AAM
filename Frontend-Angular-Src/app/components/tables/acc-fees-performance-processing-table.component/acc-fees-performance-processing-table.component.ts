import {Component, ViewChild, Input, ChangeDetectionStrategy, ElementRef} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {Subscription,  distinctUntilChanged,  from,  of, switchMap, tap } from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {StrategiesGlobalData, tableHeaders } from 'Frontend-Angular-Src/app/models/interfaces.model';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {MatChipInputEvent} from '@angular/material/chips';
import {AbstractControl, FormBuilder,  FormGroup, FormControl } from '@angular/forms';
import {formatNumber } from '@angular/common';
import {HadlingCommonDialogsService } from 'Frontend-Angular-Src/app/services/hadling-common-dialogs.service';
import {HandlingCommonTasksService } from 'Frontend-Angular-Src/app/services/handling-common-tasks.service';
import {AuthService } from 'Frontend-Angular-Src/app/services/auth.service';
import {AppInvestmentDataServiceService } from 'Frontend-Angular-Src/app/services/investment-data.service.service';
import {AppFeesHandlingService } from 'Frontend-Angular-Src/app/services/fees-handling.service';
import {HandlingTableSelectionService } from 'Frontend-Angular-Src/app/services/handling-table-selection.service';
import {SelectionModel } from '@angular/cdk/collections';
import {AppTableAccEntriesComponent } from '../acc-entries-table.component/acc-entries-table.component';
import {MatDialog, MatDialogRef } from '@angular/material/dialog';
import {AppAccountingService } from 'Frontend-Angular-Src/app/services/accounting.service';
import {FeesTransactions } from 'Frontend-Angular-Src/app/models/fees-interfaces.model';
import {AtuoCompleteService } from 'Frontend-Angular-Src/app/services/auto-complete.service';
@Component({
  selector: 'acc-fees-performance-processing-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './acc-fees-performance-processing-table.component.html',
  styleUrls: ['./acc-fees-performance-processing-table.component.scss'],
})
export class AppaIAccFeesPerformanceProcessingTableComponent {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  private subscriptions = new Subscription()
  @Input() readOnly:boolean = false;
  columnsWithHeaders: tableHeaders[] = [
    {fieldName:'select',displayName:''},
    {fieldName:'id',displayName:'ID'},
    {fieldName:'fee_date',displayName:'Date'},
    {fieldName:'portfolioname',displayName:'Code'},
    {fieldName:'fee_amount',displayName:'Fee Amount'},
    {fieldName:'fee_rate',displayName:'Rate'},
    {fieldName:'pl',displayName:'PnL'},
    {fieldName:'calculation_base',displayName:'NPV'},
    {fieldName:'hwm',displayName:'HWM'},
    {fieldName:'calculation_date',displayName:'Generated'},
    {fieldName:'b_transaction_date',displayName:'Entry Date'},
    {fieldName:'id_b_entry1',displayName:'Entries'},
    {fieldName:'id_fee_main',displayName:'ID Fee'},
    {fieldName:'fee_code',displayName:'Fee Type'},
    {fieldName:'accou ntId',displayName:'idAcc'},
    {fieldName:'id_object',displayName:'idPort'},
    {fieldName:'account_balance',displayName:'AccBalance'},
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
  accoutningDate = new FormControl<Date | null>(new Date());
  searchParametersFG: FormGroup;
  multiFilter?: (data: FeesTransactions, filter: string) => boolean;
  mp_strategies_list: StrategiesGlobalData[]=[];
  portfolios: Array<string> = ['ClearAll'];
  currencySymbol: string = '$';
  profitTaxRate:number;
  selectedRowID: number;
  selectedRowIndex: number;
  statusDetails:{};
  statusDetailsHeader:string='';
  dialogShowEntriesList: MatDialogRef<AppTableAccEntriesComponent>;
  firstForAccountingDate: Date;
  constructor(
    private AuthServiceS:AuthService,  
    private InvestmentDataService:AppInvestmentDataServiceService, 
    private AccountingDataService:AppAccountingService, 
    private HandlingCommonTasksS:HandlingCommonTasksService,
    private CommonDialogsService:HadlingCommonDialogsService,
    private AppFeesHandlingService:AppFeesHandlingService,
    private AutoCompleteService:AtuoCompleteService,
    private SelectionService:HandlingTableSelectionService,
    private fb:FormBuilder, 
    private dialog: MatDialog, 
  ) { 
    this.searchParametersFG = this.fb.group ({
      p_portfolios_list: [],
      MP:null,
      p_report_date_start:null,
      p_report_date_end:null,
    });
    this.columnsToDisplay=this.columnsWithHeaders.map(el=>el.fieldName);
    this.columnsHeaderToDisplay=this.columnsWithHeaders.map(el=>el.displayName);
   }
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  ngOnInit(): void {
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToFeesData')[0].elementvalue;
    this.disabledControlElements = this.accessState === 'full'? false : true;
    this.AccountingDataService.GetbParamsgfirstOpenedDate('GetbParamsgfirstOpenedDate').subscribe(data => this.firstForAccountingDate = data[0].FirstOpenedDate);
    this.AppFeesHandlingService.getProfitTax(new Date().toDateString()).subscribe(data=>this.profitTaxRate=data[0].rate)
    this.AutoCompleteService.subModelPortfolios.next([]);
    this.subscriptions.add(this.AutoCompleteService.subModelPortfolios.subscribe(data=>this.mp_strategies_list=data));
    this.multiFilter = (data: FeesTransactions, filter: string) => {
      let filter_array = filter.split(',').map(el=>[el,1]);
      this.columnsToDisplay.forEach(col=>filter_array.forEach(fil=>{
        data[col]&&fil[0].toString().toUpperCase()===(data[col]).toString().toUpperCase()? fil[1]=0:null
      }));
      return !filter || filter_array.reduce((acc,val)=>acc+Number(val[1]),0)===0;
    };
    this.subscriptions.add(this.AppFeesHandlingService.getCreatedAccounting().subscribe(createdTransaction=>{
      this.statusDetailsHeader='Created Management Fees details'
      this.statusDetails={...createdTransaction};
      this.submitQuery(false,false);  
    }));
    this.subscriptions.add(this.accoutningDate.valueChanges.pipe(distinctUntilChanged()).subscribe(()=>this.updateAccountsBalances()));
    this.submitQuery(false,false)
  }
  resetSearchForm () {
    this.searchParametersFG.reset();
    this.portfolios=['ClearAll'];
  }
  setPortfoliosList(mp:string) {
    this.InvestmentDataService.getPortfoliosListForMP(mp,'getPortfoliosByMP_StrtgyID').subscribe(data=>{
      this.portfolios=['ClearAll',...data]
      this.filterALL.nativeElement.value = mp;
    })
  }
  updateDataTable (managementFeeData:FeesTransactions[]) {
    this.fullDataSource=managementFeeData;
    this.dataSource  = new MatTableDataSource(managementFeeData);
    this.dataSource.filterPredicate =this.multiFilter
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    let dates = this.dataSource.data.map(el=>el.fee_date)
    this.firstForAccountingDate = new Date (dates.sort(function(a,b){
      return new Date(a).getTime() - new Date(b).getTime()
     })[dates.length-1])
     this.portfolios = ['ClearAll',...new Set(this.fullDataSource.map(el=>el.portfolioname))]
    this.updateAccountsBalances();
  }
  submitQuery ( reset:boolean=false, showSnackResult:boolean=true) {
    this.selection.clear();
    let searchObj = reset?  {} : this.searchParametersFG.value;
    this.dataSource?.data? this.dataSource.data = null : null;
    searchObj.p_report_date_start = new Date (this.dateRangeStart.value).toDateString();
    searchObj.p_report_date_end = this.dateRangeEnd.value? new Date (this.dateRangeEnd.value).toDateString(): new Date().toDateString();
    of(this.portfolios.length).pipe(
      switchMap(portLength => portLength===1? this.InvestmentDataService.getPortfoliosListForMP('All','getPortfoliosByMP_StrtgyID'):from([[...this.portfolios]])),
      tap(ports=>searchObj.p_portfolios_list = ports.map(el=>el.toUpperCase())),
      switchMap(()=>this.AppFeesHandlingService.getFeesPerformanceTransactions(searchObj))
    ).subscribe(data => {
      this.updateDataTable(data)
      showSnackResult? this.CommonDialogsService.snackResultHandler({
        name:data['name'], 
        detail:data['name'] === 'error'? data['detail'] :  formatNumber (data.length,'en-US') + ' rows'}, 'Loaded ') : null;
    });
  }
  updateAccountsBalances () {
    if (this.portfolios.length>1) {
      this.AccountingDataService.getBalanceDatePerPorfoliosOnData(this.portfolios,this.accoutningDate.value)
      .subscribe(dataBalance=>{
        this.dataSource.data.forEach(el=>{
            el.account_balance = dataBalance.find(bd=>bd.account_id===el.accountId).current_balance - el.fee_amount;
        });
        this.dataSource.sort=this.sort;
      })
    }
  }
  deleteAccounting () {
    let feesToProcess = this.selection.selected;
    this.AppFeesHandlingService.deleteMFAccounting(feesToProcess)
    this.selection.clear();
  }
  createAccounting () {
    let feesToProcess = this.selection.selected.filter(el=>el.fee_amount>0);
    feesToProcess.length>0?
      this.AppFeesHandlingService.createAccountingForManagementFees(feesToProcess,this.profitTaxRate,this.accoutningDate.value)
      :this.CommonDialogsService.snackResultHandler({name:'error',detail:'There are no transactions to process'});
    this.selection.clear();
  }
  deleteCalculation () {
    let feesToProcess = this.selection.selected;
    this.AppFeesHandlingService.deleteFeesCalculation(feesToProcess.map(el=>Number(el.id)));
    this.selection.clear();
  }
  showEntries(entries: number[]) {
    this.dialogShowEntriesList = this.dialog.open(AppTableAccEntriesComponent ,{minHeight:'600px', minWidth:'1700px', autoFocus: false, maxHeight: '90vh'});
    this.dialogShowEntriesList.componentInstance.paramRowData = {entries:entries}; 
    this.dialogShowEntriesList.componentInstance.action = 'ViewEntriesByEntriesIds';
    this.dialogShowEntriesList.componentInstance.UI_min = true; 
    this.subscriptions.add(this.dialogShowEntriesList.componentInstance.modal_principal_parent.subscribe (()=>this.dialogShowEntriesList.close()));
  }
  changedValueofChip (value:string, chipArray:string[]) {
    chipArray[chipArray.length-1] === 'ClearAll'? chipArray.push(value) : chipArray[chipArray.length-1] = value
  }
  add(event: MatChipInputEvent,chipArray:string[]): string[] {
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
      account_balance:'number',
      pl: 'number', 
      hwm: 'number'
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
    this.HandlingCommonTasksS.exportToExcel (dataToExport,"processingPerformanceFeeData");  
  }
   get  idportfolios () {return this.searchParametersFG.get('p_portfolios_list') } 
  get  dateRangeStart () {return this.dataRange.get('dateRangeStart') } 
  get  dateRangeEnd () {return this.dataRange.get('dateRangeEnd') } 
  get  dataRangeSF () {return this.searchParametersFG.get('dataRangeSF') } 
}