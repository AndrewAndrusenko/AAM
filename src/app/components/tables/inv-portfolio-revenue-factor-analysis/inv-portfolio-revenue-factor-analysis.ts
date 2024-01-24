import {Component, EventEmitter, Output, ViewChild, Input, ChangeDetectionStrategy, ElementRef, SimpleChanges} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {Observable, Subscription, distinctUntilChanged, filter, from, map, of, startWith, switchMap, tap } from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {RevenueFactorData,tableHeaders } from 'src/app/models/interfaces.model';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {MatChipInputEvent} from '@angular/material/chips';
import {AbstractControl, FormBuilder, Validators, FormGroup, FormControl } from '@angular/forms';
import {formatNumber } from '@angular/common';
import {HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import {HandlingCommonTasksService } from 'src/app/services/handling-common-tasks.service';
import {AuthService } from 'src/app/services/auth.service';
import {AtuoCompleteService } from 'src/app/services/auto-complete.service';
import {AppInvestmentDataServiceService } from 'src/app/services/investment-data.service.service';
import {indexDBService } from 'src/app/services/indexDB.service';
import {MatCheckbox } from '@angular/material/checkbox';
@Component({
  selector: 'app-inv-portfolio-revenue-factor-analysis',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inv-portfolio-revenue-factor-analysis.html',
  styleUrls: ['./inv-portfolio-revenue-factor-analysis.scss'],
})
export class AppaInvPortfolioRevenueFactorAnalysisTableComponent {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  private subscriptions = new Subscription()
  @Input() useGetClientsPortfolios:boolean = false;
  @Input() rowsPerPages:number = 20;
  @Input() filters:any;
  @Input() UI_portfolio_selection:boolean = true;
  columnsWithHeaders: tableHeaders[] = [
    {fieldName:'report_date',displayName:'Date'},
    {fieldName:'portfolioname',displayName:'Code'},
    {fieldName:'secid',displayName:'SecID'},
    {fieldName:'total_pl',displayName:'Total PnL'},
    {fieldName:'mtm_pl',displayName:'Unrealized PnL'},
    {fieldName:'pl',displayName:'Realized PnL'},
    {fieldName:'pos_pv',displayName:'Postion MTM'},
    {fieldName:'current_fifo_position_cost',displayName:'Position cost'},
    {fieldName:'balance',displayName:'Qantity'},
    {fieldName:'mtm_rate',displayName:'MTM rate'},
    {fieldName:'mtm_date',displayName:'MTM date'},
    {fieldName:'dirty_price',displayName:'Dirty Price'},
    {fieldName:'cross_rate',displayName:'Exch rate'},
    {fieldName:'mtm_cross_rate',displayName:'MTM rate'},
    {fieldName:'idportfolio',displayName:'ID'},
  ]
  columnsToDisplay: string [];
  columnsHeaderToDisplay: string [];
  dataSource: MatTableDataSource<RevenueFactorData>;
  fullDataSource: RevenueFactorData[];
  @ViewChild('filterALL', { static: false }) filterALL: ElementRef;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @Output() public modal_principal_parent = new EventEmitter();
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  dataRange = new FormGroup ({
    dateRangeStart: new FormControl<Date | null>(new Date()),
    dateRangeEnd: new FormControl<Date | null>(new Date()),
  });
  portfolios: Array<string> = ['ClearAll','VPC005','ACM002','ICM011'];
  searchParametersFG: FormGroup;
  filteredCurrenciesList: Observable<string[]>;
  mp_strategies_list: string[]=[];
  currencySymbol: string = '$';
  multiFilter?: (data: any, filter: string) => boolean;
  constructor(
    private AuthServiceS:AuthService,  
    private indexDBServiceS:indexDBService,
    private InvestmentDataService:AppInvestmentDataServiceService, 
    private HandlingCommonTasksS:HandlingCommonTasksService,
    private CommonDialogsService:HadlingCommonDialogsService,
    private AutoCompService:AtuoCompleteService,
    private fb:FormBuilder, 
  ) {
    this.columnsToDisplay=this.columnsWithHeaders.map(el=>el.fieldName);
    this.columnsHeaderToDisplay=this.columnsWithHeaders.map(el=>el.displayName);
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToTradesData')[0].elementvalue;
    this.disabledControlElements = this.accessState === 'full'? false : true;
    this.dateRangeStart.value.setMonth(this.dateRangeStart.value.getMonth()-2);
    this.searchParametersFG = this.fb.group ({
      p_portfolios_list:  [],
      MP:null,
      p_report_date_start:null,
      p_report_date_end:null,
      p_report_currency:['840', { validators:  Validators.required}],
    });
  }
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  ngOnInit(): void {
    this.filters? this.setFilters(this.filters):null;
    this.indexDBServiceS.getIndexDBStaticTables('getModelPortfolios').then ((data)=>{
      this.mp_strategies_list = data['data']
    })
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
      map(value => this.AutoCompService.filterList(value || '','currency'))
    );
    this.multiFilter = (data: RevenueFactorData, filter: string) => {
      let filter_array = filter.split(',').map(el=>[el,1]);
      this.columnsToDisplay.forEach(col=>filter_array.forEach(fil=>{
        data[col]&&fil[0].toString().toUpperCase()===(data[col]).toString().toUpperCase()? fil[1]=0:null
      })
        );
      return !filter || filter_array.reduce((acc,val)=>acc+Number(val[1]),0)===0;
    }
  }
  setFilters (filters:any) {
    if (filters.reset === true) {
      return this.InvestmentDataService.sendPerformnceData({data:null,currencySymbol:'', showChart: false})

    }
    filters.portfolio_code? this.portfolios =['ClearAll',...filters.portfolio_code]:null;
    this.submitQuery(false,false);
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
  ngOnChanges(changes: SimpleChanges) {

    console.log('per table change',);

    changes['filters']?.currentValue? this.setFilters(changes['filters']?.currentValue) : null;
  }
  updateDataTable (revenueData:RevenueFactorData[]) {
    this.AutoCompService.fullCurrenciesList.length? this.currencyChanged(this.report_id_currency.value):null;
    this.fullDataSource=revenueData;
    this.dataSource  = new MatTableDataSource(revenueData);
    this.dataSource.filterPredicate =this.multiFilter
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.InvestmentDataService.sendRevenueFactorData({data:revenueData,currencySymbol:this.currencySymbol,showChart:true})
  }
  submitQuery (reset:boolean=false, showSnackResult:boolean=true) {
    let searchObj = reset?  {} : this.searchParametersFG.value;
    this.dataSource?.data? this.dataSource.data = null : null;
    searchObj.p_report_date_start = new Date (this.dateRangeStart.value).toLocaleDateString();
    searchObj.p_report_date_end = this.dateRangeEnd.value? new Date (this.dateRangeEnd.value).toLocaleDateString(): new Date().toLocaleDateString();
    of(this.portfolios.length).pipe(
      switchMap(portLength => portLength===1? this.InvestmentDataService.getPortfoliosListForMP('All','getPortfoliosByMP_StrtgyID'):from([[...this.portfolios]])),
      tap(ports=>searchObj.p_portfolios_list = ports.map(el=>el.toUpperCase())),
      switchMap(()=>this.InvestmentDataService.getRevenueFactorData(searchObj))
    ).subscribe(data => {
      this.updateDataTable(data)
      showSnackResult? this.CommonDialogsService.snackResultHandler({name:'success',detail: formatNumber (data.length,'en-US') + ' rows'}, 'Loaded ') : null;
    });
  }
  changedValueofChip (value:string, chipArray:string[],control:AbstractControl) {
    chipArray[chipArray.length-1] === 'ClearAll'? chipArray.push(value) : chipArray[chipArray.length-1] = value
  }
  add(event: MatChipInputEvent,chipArray:string[],control:AbstractControl): any[] {
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
  currencyChanged(code:string) {
    this.currencySymbol = this.AutoCompService.fullCurrenciesList.filter(el=>el['CurrencyCodeNum']==code)[0]['symbol'];
  }
  exportToExcel() {
    let numberFields=['account_currency_code','idportfolio','cross_rate','dirty_price','mtm_rate','balance','current_fifo_position_cost','pos_pv','pl','mtm_pl','total_pl'];
    let dateFields=['report_date','mtm_date','rate_date'];
    let dataToExport =  this.dataSource.data.map(el=>{
      Object.keys(el).forEach(key=>{
        switch (true==true) {
          case  numberFields.includes(key): return el[key]=Number(el[key]) ;
          case dateFields.includes(key): return el[key]=new Date(el[key])
          default: return el[key]=el[key]
        }
      })
      return el;
    });
    this.HandlingCommonTasksS.exportToExcel (dataToExport,"RevenueFactorData");  
  }
  get  idportfolios () {return this.searchParametersFG.get('p_portfolios_list') } 
  get  dateRangeStart () {return this.dataRange.get('dateRangeStart') } 
  get  dateRangeEnd () {return this.dataRange.get('dateRangeEnd') } 
  get  report_id_currency () {return this.searchParametersFG.get('p_report_currency') } 
  get  dataRangeSF () {return this.searchParametersFG.get('dataRangeSF') } 
}