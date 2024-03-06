import {Component, EventEmitter, Output, ViewChild, Input, ChangeDetectionStrategy, ElementRef, SimpleChanges} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {Observable, Subscription, distinctUntilChanged, filter, map, startWith, switchMap, tap } from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {StrategiesGlobalData, currencyCode, portfolioPositions } from 'src/app/models/interfaces.model';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {MatChipInputEvent} from '@angular/material/chips';
import {AbstractControl, FormBuilder, Validators, FormGroup } from '@angular/forms';
import {formatNumber } from '@angular/common';
import {HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import {HandlingCommonTasksService } from 'src/app/services/handling-common-tasks.service';
import {AuthService } from 'src/app/services/auth.service';
import {AtuoCompleteService } from 'src/app/services/auto-complete.service';
import {AppInvestmentDataServiceService } from 'src/app/services/investment-data.service.service';
import {indexDBService } from 'src/app/services/indexDB.service';
import {MatCheckbox } from '@angular/material/checkbox';
import { MatSelectChange } from '@angular/material/select';
interface localFilters {
  reset?:boolean,
  portfolio_code?:string[],
  null_data?:boolean,
  rest?:boolean
}
@Component({
  selector: 'app-inv-portfolio-position-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inv-portfolio-position-table.component.html',
  styleUrls: ['./inv-portfolio-position-table.component.scss'],
})
export class AppaInvPortfolioPositionTableComponent {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  private subscriptions = new Subscription()
  @Input() useGetClientsPortfolios:boolean = false;
  @Input() rowsPerPages:number = 15;
  @Input() filters:localFilters;
  @Input() readOnly:boolean = false;
  @Input() UI_portfolio_selection:boolean = true;
  @Input() UI_portfolio_zero:boolean = true;
  columnsToDisplay = ['portfolio_code','secid','mp_name','fact_weight','current_balance','mtm_positon','weight','planned_position','deviation_percent','order_amount','mtm_rate','total_pl','pl','unrealizedpl','cost_in_position','mtm_date','order_type','order_qty','orders_unaccounted_qty','mtm_dirty_price','cross_rate','strategy_name','cost_full_position','rate_date'];
  columnsHeaderToDisplay = ['Code','SecID','MP','Fact %','Balance','PositionMTM','MP %','MP_Position','DV%','Deviation','MTM_Rate','Total PL','FIFO PL','MTM PL','Position Cost','MTM_Date','TypeBS','Deviation Qty','Qty in Active Orders ','MTM_Dirty','CurRate','Strategy','Cost Full','CurDate']
  dataSource: MatTableDataSource<portfolioPositions>;
  fullDataSource: portfolioPositions[];
  @ViewChild('filterALL', { static: false }) filterALL: ElementRef;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('notNull') notNullCB: MatCheckbox;
  @Output() public modal_principal_parent = new EventEmitter();
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  instruments: string[] = ['ClearAll'];
  portfolios: string[] = ['ClearAll'];
  filterednstrumentsLists : Observable<string[]>;
  searchParametersFG: FormGroup;
  defaultFilterPredicate?: (data: portfolioPositions, filter: string) => boolean;
  multiFilter?: (data: portfolioPositions, filter: string) => boolean;
  filteredCurrenciesList: Observable<currencyCode[]>;
  mp_strategies_list: StrategiesGlobalData[]=[];
  constructor(
    private AuthService:AuthService,  
    private indexDBService:indexDBService,
    private InvestmentDataService:AppInvestmentDataServiceService, 
    private HandlingCommonTasksS:HandlingCommonTasksService,
    private CommonDialogsService:HadlingCommonDialogsService,
    private AutoCompService:AtuoCompleteService,
    private fb:FormBuilder, 
  ) {
    this.accessState = this.AuthService.accessRestrictions.filter(el =>el.elementid==='accessToTradesData')[0].elementvalue;
    this.disabledControlElements = this.accessState === 'full'? false : true;
    this.searchParametersFG = this.fb.group ({
      idportfolios:  [],
      MP:null,
      notnull:true,
      report_date : [new Date(), { validators:  Validators.required, updateOn: 'blur' }],
      report_id_currency:['840', { validators:  Validators.required}],
    });
  }
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  ngOnInit(): void {
    this.filters? this.setFilters(this.filters):null;
    this.indexDBService.getIndexDBStaticTables('getModelPortfolios').subscribe (data=>this.mp_strategies_list = data.data as StrategiesGlobalData[]);
    if (this.useGetClientsPortfolios===true) {
      this.subscriptions.add(this.InvestmentDataService.getClientsPortfolios().pipe(
        tap(() => this.dataSource? this.dataSource.data = null: null),
        tap(portfolios => portfolios.length===0?  this.filters = {null_data:true}: null),
        filter(portfolios=>portfolios.length>0)
      ).subscribe(portfoliosData=> {
        this.filters = {portfolio_code: portfoliosData.map(el=>el.code)};
        this.setFilters (this.filters);
              }));
    }
    this.subscriptions.add(this.AutoCompService.recieveCurrencyListReady().subscribe(()=>this.report_id_currency.updateValueAndValidity()));
    this.AutoCompService.getCurrencyList();
    this.filteredCurrenciesList = this.report_id_currency.valueChanges.pipe (
      startWith (''),
      distinctUntilChanged(),
      map(value => this.AutoCompService.filterList(value || '','currency') as currencyCode[])
    );
    this.multiFilter = (data: portfolioPositions, filter: string) => {
      let filter_array = filter.split(',').map(el=>[el,1]);
      this.columnsToDisplay.forEach(col=>filter_array.forEach(fil=>{
        data[col]&&fil[0].toString().toUpperCase()===(data[col]).toString().toUpperCase()? fil[1]=0:null
      })
        );
      return !filter || filter_array.reduce((acc,val)=>acc+Number(val[1]),0)===0;
    }
  }
  setPortfoliosList(e:MatSelectChange) {
    this.InvestmentDataService.getPortfoliosListForMP(e.value,'getPortfoliosByMP_StrtgyID').subscribe(data=>{
      this.portfolios=['ClearAll',...data]
      this.filterALL.nativeElement.value = e.value;
      (this.dataSource?.paginator)? this.dataSource.paginator.firstPage() : null;
    })
  }
  showZeroPortfolios(event:boolean) {
    if (event) {
      this.dataSource.data = this.fullDataSource;
    } else {
      this.dataSource.data = this.dataSource.filteredData.filter(el=>el['not_zero_npv']===true)
    }
  }
  initialFilterOfDataSource (filter:localFilters) {
    if (filter?.rest===true) {
      this.dataSource.data = this.fullDataSource;
      return;
    }
    if (filter?.null_data===true) {
      this.dataSource.data=null;
    } else {
    Object.keys(filter).every(key=>{
      this.dataSource.data = this.fullDataSource.filter(el=>filter[key].includes(el[key]))
      if (this.dataSource.data.length) {return false}  else return true;
     })
    }
  }
  ngOnChanges(changes: SimpleChanges) {
    changes['filters']?.currentValue? this.setFilters(changes['filters']?.currentValue) : null;
    this.notNullCB?.checked===false? this.showZeroPortfolios(false):null;
  }
  setFilters (filters:localFilters) {
    filters.portfolio_code? this.portfolios =['ClearAll',...filters.portfolio_code]:null;
    this.submitQuery(false,false);
  }
  updatePositionsDataTable (positionsData:portfolioPositions[]) {
    this.fullDataSource = positionsData;
    this.dataSource  = new MatTableDataSource(positionsData);
    this.dataSource.filterPredicate =this.multiFilter
    this.filterALL? this.filterALL.nativeElement.value=null : null;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.notNullCB?.checked===false? this.showZeroPortfolios(false):null;
  }
  submitQuery (reset:boolean=false, showSnackResult:boolean=true) {
    let searchObj = reset?  {} : this.searchParametersFG.value;
    this.dataSource?.data? this.dataSource.data = null : null;
    searchObj.report_date= new Date (searchObj.report_date).toLocaleDateString();
    searchObj.idportfolios = [0,1].includes(this.portfolios.length)&&this.portfolios[0]==='ClearAll'? null : this.portfolios.map(el=>el.toLocaleLowerCase())
    this.InvestmentDataService.getPortfoliosPositions(searchObj).subscribe(data => {
      this.updatePositionsDataTable(data)
      let sum ={
       npv:this.getTotals('mtm_positon'),
       PnL:this.getTotals('total_pl'),
       managementFee:data.find(el=>el.secid==='Management Fees')?.total_pl??0,
       perfomanceFee:data.find(el=>el.secid==='Performance Fees')?.total_pl??0
      }
      this.InvestmentDataService.sendSummaryPortfolioData(sum)
      showSnackResult? this.CommonDialogsService.snackResultHandler({name:'success',detail: formatNumber (data.length,'en-US') + ' rows'}, 'Loaded ') : null;
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
  getTotals (col:string) {
    return (this.dataSource&&this.dataSource.data)?  this.dataSource.filteredData.map(el => el[col]).reduce((acc, value) => acc + Number(value), 0):0;
  }
  exportToExcel() {
    let numberFields=['notnull_npv','mtm_positon_base_cur','npv','total_pl','roi','pl','unrealizedpl','cost_in_position','idportfolio','fact_weight','current_balance','mtm_positon','weight','planned_position','order_amount','order_qty','mtm_rate','cross_rate','mtm_dirty_price','pl'];
    let dateFields=['mtm_date','rate_date'];
    this.HandlingCommonTasksS.exportToExcel (this.dataSource.data,"positionsData",numberFields,dateFields);  
  }
  get  idportfolios () {return this.searchParametersFG.get('idportfolios') } 
  get  report_date () {return this.searchParametersFG.get('report_date') } 
  get  report_id_currency () {return this.searchParametersFG.get('report_id_currency') } 
}