import {Component, EventEmitter, Output, ViewChild, Input, ChangeDetectionStrategy, ElementRef, SimpleChanges} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {Observable, Subscription, distinctUntilChanged, map, startWith, switchMap, tap } from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {StrategiesGlobalData, currencyCode, portfolioPositions, trades } from 'src/app/models/interfaces.model';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {MatChipInputEvent} from '@angular/material/chips';
import {AbstractControl, FormBuilder, Validators, FormGroup } from '@angular/forms';
import {formatNumber } from '@angular/common';
import {HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import {HandlingCommonTasksService } from 'src/app/services/handling-common-tasks.service';
import {AuthService } from 'src/app/services/auth.service';
import { AtuoCompleteService } from 'src/app/services/auto-complete.service';
import {AppInvestmentDataServiceService } from 'src/app/services/investment-data.service.service';
import { indexDBService } from 'src/app/services/indexDB.service';
import { TreeMenuSevice } from 'src/app/services/tree-menu.service';
import { AppTradeService } from 'src/app/services/trades-service.service';
import { MatSelectChange } from '@angular/material/select';
import { valHooks } from 'jquery';

interface localFilters {
  reset?:boolean,
  portfolio_code?:string[],
  null_data?:boolean,
  rest?:boolean
}
@Component({
  selector: 'app-inv-generate-orders-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inv-generate-orders-table.component.html',
  styleUrls: ['./inv-generate-orders-table.component.scss'],
})
export class AppInvGenerateOrdersTable{
  accessState: string = 'none';
  private subscriptions = new Subscription()
  disabledControlElements: boolean = false;
  @Input() rowsPerPages:number = 15;
  @Input() filters:localFilters;
  columnsToDisplay = ['portfolio_code','secid','fact_weight','weight','deviation_percent','order_amount','mtm_positon','planned_position','mtm_rate','mtm_date','orders_unaccounted','mp_name','strategy_name','order_qty','orders_unaccounted_qty','current_balance','order_type','mtm_dirty_price','cross_rate','rate_date'];
  columnsHeaderToDisplay = ['Code','SecID','Fact %','MP %','DV%','Deviation','CurrentMTM','Targeted_MP','MTM_Rate','MTM_Date','Active Orders','MP','Strategy','Deviation Qty','Orders Qty','Balance','TypeBS','MTM_Dirty','CurRate','CurDate']
  dataSource: MatTableDataSource<portfolioPositions>;
  fullDataSource: portfolioPositions[];
  @ViewChild('filterALL', { static: false }) filterALL: ElementRef;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @Output() public modal_principal_parent = new EventEmitter();
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  instruments: string[] = ['ClearAll'];
  portfolios: string[] = ['ClearAll'];
  filterednstrumentsLists : Observable<string[][]>;
  filteredCurrenciesList: Observable<currencyCode[]>;
  searchParametersFG: FormGroup;
  defaultFilterPredicate?: (data: portfolioPositions, filter: string) => boolean;
  multiFilter?: (data: portfolioPositions, filter: string) => boolean;
  mp_strategies_list: StrategiesGlobalData[]=[];
  activeTab:string='';
  tabsNames = ['Generate Orders']
  constructor(
    private TreeMenuSevice: TreeMenuSevice,
    private TradeService: AppTradeService,
    private AuthServiceS:AuthService,  
    private indexDBServiceS:indexDBService,
    private InvestmentDataService:AppInvestmentDataServiceService, 
    private HandlingCommonTasksS:HandlingCommonTasksService,
    private CommonDialogsService:HadlingCommonDialogsService,
    private AutoCompService:AtuoCompleteService,
    private fb:FormBuilder, 
  ) {
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToTradesData')[0].elementvalue;
    this.disabledControlElements = this.accessState === 'full'? false : true;
    this.searchParametersFG = this.fb.group ({
      secidList: [],
      idportfolios:  [],
      MP:null,
      secArray:null,
      leverage:[2,{validators:Validators.required}],
      deviation:[0.01,{validators:Validators.pattern('[0-9.]*')}],
      old_mark:[15,{validators:Validators.pattern('[0-9]*')}],
      report_date : [new Date(), { validators:  Validators.required, updateOn: 'blur' }],
      report_id_currency:['840', { validators:  [this.AutoCompService.currencyValirator(),Validators.required]}],
    });
  }
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  ngOnInit(): void {
    this.indexDBServiceS.getIndexDBStaticTables('getModelPortfolios').subscribe ((data)=>{
      this.mp_strategies_list = (data.data as StrategiesGlobalData[])
    })
    this.multiFilter = (data: portfolioPositions, filter: string) => {
      let filter_array = filter.split(',').map(el=>[el,1]);
      this.columnsToDisplay.forEach(col=>filter_array.forEach(fil=>{
        data[col]&&fil[0].toString().toUpperCase()===(data[col]).toString().toUpperCase()? fil[1]=0:null
      })
        );
      return !filter || filter_array.reduce((acc,val)=>acc+Number(val[1]),0)===0;
    };
    this.AutoCompService.getCurrencyList();
    this.subscriptions.add(this.AutoCompService.recieveCurrencyListReady().subscribe(()=>this.report_id_currency.updateValueAndValidity()));
    this.AutoCompService.getSecidLists();
    this.filters==undefined&&this.fullDataSource!==undefined? this.initialFilterOfDataSource(this.filters) : null;
    this.filterednstrumentsLists = this.secidList.valueChanges.pipe(
      startWith(''),
      distinctUntilChanged(),
      map(value => this.AutoCompService.filterList(value || '','secid') as string[][])
    );
    this.filteredCurrenciesList = this.report_id_currency.valueChanges.pipe (
      startWith (''),
      distinctUntilChanged(),
      map(value => this.AutoCompService.filterList(value || '','currency') as currencyCode[])
    );
    this.subscriptions.add(this.TreeMenuSevice.getActiveTab().subscribe(tabName=>this.activeTab=tabName));

  }
  setPortfoliosList(e:MatSelectChange) {
    this.InvestmentDataService.getPortfoliosListForMP(e.value,'getPortfoliosByMP_StrtgyID').subscribe(data=>{
      this.portfolios=['ClearAll',...data];
      this.dataSource?.paginator? this.dataSource.paginator.firstPage() : null;
    })
  }
  initialFilterOfDataSource (filter:localFilters) {
   Object.keys(filter).every(key=>{
    this.dataSource.data = this.fullDataSource.filter(el=>el[key]===filter[key])
    if (this.dataSource.data.length) {return false}  else return true;
   })
  }
  ngOnChanges(changes: SimpleChanges) {
    changes['filters'].currentValue==undefined&&this.fullDataSource!==undefined?  this.initialFilterOfDataSource (changes['filters'].currentValue):null;
  }
  createOrders (){
    let params_data = this.searchParametersFG.value;
    this.dataSource?.data? this.dataSource.data = null : null;
    params_data.secidList = [0,1].includes(this.instruments.length)&&this.instruments[0]==='ClearAll'? null : this.instruments.map(el=>el.toLocaleLowerCase())
    params_data.idportfolios = [0,1].includes(this.portfolios.length)&&this.portfolios[0]==='ClearAll'? null : this.portfolios.map(el=>el.toLocaleLowerCase())
    this.TradeService.createOrderbyMP(params_data).subscribe(data=>{
      this.CommonDialogsService.snackResultHandler(data, 'Created ' + formatNumber (data.length,'en-US') + ' orders' )
    })
  }
  applyFilter(event: KeyboardEvent, col?:string) {
    this.dataSource.filterPredicate = col === undefined? this.defaultFilterPredicate : this.multiFilter
    const filterValue = (event.target as HTMLInputElement).value 
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage();}
  }
  updatePositionsDataTable (positionsData:portfolioPositions[],snackResultHandler) {
    this.MP.value? positionsData = positionsData.filter(el=>el.mp_name===this.MP.value||el.strategy_name===this.MP.value) : null;
    this.fullDataSource=positionsData;
    this.dataSource  = new MatTableDataSource(positionsData);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.instruments=['ClearAll',...[...new Set(this.dataSource.data.map(el=>el.secid))]];
    this.filters? this.initialFilterOfDataSource(this.filters) : null;
    let outOfDateMarks = new Date()
    outOfDateMarks.setDate(new Date().getDate()-this.old_mark.value)
    let oldMarksSet =this.dataSource.data.filter(el=>new Date(el.mtm_date)<outOfDateMarks)
    if (oldMarksSet.length) {
      this.dataSource.data=oldMarksSet;
      this.CommonDialogsService.snackResultHandler({name:'error',detail:oldMarksSet.length +' orders have been calculated based on irrelevant market quotes'})
    } else {
      snackResultHandler? this.CommonDialogsService.snackResultHandler({name:'success',detail: formatNumber (positionsData.length,'en-US') + ' rows'}, 'Loaded ') : null;

    };
    this.dataSource.filterPredicate =this.multiFilter
    this.defaultFilterPredicate = this.dataSource.filterPredicate;
    this.multiFilter = this.dataSource.filterPredicate;
  }
  submitQuery (reset:boolean=false, showSnackResult:boolean=true) {
    let searchObj = reset?  {} : this.searchParametersFG.value;
    this.dataSource?.data? this.dataSource.data = null : null;
    searchObj.secidList = [0,1].includes(this.instruments.length)&&this.instruments[0]==='ClearAll'? null : this.instruments.map(el=>el.toLocaleLowerCase())
    searchObj.idportfolios = [0,1].includes(this.portfolios.length)&&this.portfolios[0]==='ClearAll'? null : this.portfolios.map(el=>el.toLocaleLowerCase())
    searchObj.report_date= new Date (searchObj.report_date).toDateString();
    this.InvestmentDataService.getPortfolioMpDeviations(searchObj).subscribe(data => {
      this.updatePositionsDataTable(data,showSnackResult)
    });
  }
  changedValueofChip (value:string, chipArray:string[],control:AbstractControl) {
    chipArray[chipArray.length-1] === 'ClearAll'? chipArray.push(value) : chipArray[chipArray.length-1] = value
  }
  add(event: MatChipInputEvent,chipArray:string[],control:AbstractControl): string[] {
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
    if (['ClearAll cancel','ClearAll'].includes(event.target.textContent.trim())) {chipArray = ['ClearAll']};
    return chipArray;
  }
  resetSPform () {
    this.searchParametersFG.reset();
    this.instruments=['ClearAll'];
    this.portfolios=['ClearAll'];
    this.report_date.patchValue(new Date());
  }
  updateFilter (el: string) {
    this.filterALL.nativeElement.value = this.filterALL.nativeElement.value + el+',';
    this.dataSource.filter = this.filterALL.nativeElement.value.slice(0,-1).trim().toLowerCase();
    (this.dataSource.paginator)? this.dataSource.paginator.firstPage() : null;
  }
  clearFilter (input:HTMLInputElement) {
    input.value=''
    this.dataSource.filter = ''
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage()}
  }
  getTotals (col:string) {
    return (this.dataSource&&this.dataSource.data)?  this.dataSource.filteredData.map(el => el[col]).reduce((acc, value) => acc + Number(value), 0):0;
  }
  showTip (tipIndex:number) {
    let tips:string[] = [
      '\nOrders are not generated if leverage restriction is exceeded',
      '\nOrders are generated within available leverage restriction',
      '\nAll confirmed orders deems as executed.\nThey are taken into account when leverage restriction is verified',
      '\nLeverage resctriction is verified against model portfolio leverage.\nAn order is valid if restriction is above model portfolio leverage'
    ]
    this.CommonDialogsService.snackResultHandler({name:'success', detail:tips[tipIndex]},'Tip',undefined,undefined,15000)
  }
  exportToExcel() {
    let numberFields=['total_pl','roi','pl','unrealizedpl','cost_in_position','idportfolio','fact_weight','current_balance','mtm_positon','weight','planned_position','order_amount','order_qty','mtm_rate','cross_rate','mtm_dirty_price','pl'];
    let dateFields=['mtm_date','rate_date'];
    this.HandlingCommonTasksS.exportToExcel (this.dataSource.data,"generateOrdersData",numberFields,dateFields);  
  }
  get  secidList () {return this.searchParametersFG.get('secidList') } 
  get  idportfolios () {return this.searchParametersFG.get('idportfolios') } 
  get  report_date () {return this.searchParametersFG.get('report_date') } 
  get  report_id_currency () {return this.searchParametersFG.get('report_id_currency') } 
  get  deviation () {return this.searchParametersFG.get('deviation') } 
  get  old_mark () {return this.searchParametersFG.get('old_mark') } 
  get  secArray () {return this.searchParametersFG.get('secArray') } 
  get  MP () {return this.searchParametersFG.get('MP') } 
}