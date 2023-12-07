import {Component, EventEmitter, Output, ViewChild, Input, ChangeDetectionStrategy, ElementRef, SimpleChanges} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {Observable, Subscription, distinctUntilChanged, filter, from, map, of, startWith, switchMap, tap } from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {PortfolioPerformnceData,tableHeaders } from 'src/app/models/intefaces.model';
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
  selector: 'app-inv-portfolio-npv_roi_performance',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inv-portfolio-npv_roi_performance.html',
  styleUrls: ['./inv-portfolio-npv_roi_performance.scss'],
})
export class AppaInvPortfolioNpvRoiPerformanceTableComponent {
 
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  private subscriptions = new Subscription()
  @Input() useGetClientsPortfolios:boolean = false;
  @Input() rowsPerPages:number = 20;
  @Input() filters:any;
  @Input() readOnly:boolean = false;
  columnsWithHeaders: tableHeaders[] = [
    {fieldName:'portfolioname',displayName:'Code'},
    {fieldName:'report_date',displayName:'Date'},
    {fieldName:'npv',displayName:'NPV'},
    {fieldName:'roi_current_period',displayName:'ROI'},
    {fieldName:'time_wighted_roi',displayName:'TW ROI'},
    {fieldName:'last_npv',displayName:'Start NPV'},
    {fieldName:'cash_flow',displayName:'Cash Flow'},
    {fieldName:'correction_rate',displayName:'Correction'},
    {fieldName:'correction_rate_compound',displayName:'TW Correction'},
    {fieldName:'period_start_date',displayName:'Start_Date'}
  ];
  columnsToDisplay: string [];
  columnsHeaderToDisplay: string [];
  dataSource: MatTableDataSource<PortfolioPerformnceData>;
  fullDataSource: PortfolioPerformnceData[];
  @ViewChild('filterALL', { static: false }) filterALL: ElementRef;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('notNull') notNullCB: MatCheckbox;
  @Output() public modal_principal_parent = new EventEmitter();
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  dataRange = new FormGroup ({
    dateRangeStart: new FormControl<Date | null>(new Date()),
    dateRangeEnd: new FormControl<Date | null>(new Date()),
  });
  instruments: string[] = ['ClearAll'];
  portfolios: Array<string> = ['ClearAll'];
  filterednstrumentsLists : Observable<string[]>;
  searchParametersFG: FormGroup;
  defaultFilterPredicate?: (data: any, filter: string) => boolean;
  multiFilter?: (data: any, filter: string) => boolean;
  filteredCurrenciesList: Observable<string[]>;
  mp_strategies_list: string[]=[];
  currencySymbol: string = '$';
/*   activeTab:string='';
  tabsNames = ['Portfolio Positions']
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) { 
    if (this.tabsNames.includes(this.activeTab)){
      event.altKey&&event.key==='r'? this.submitQuery(false,true):null;
      event.altKey&&event.key==='w'? this.exportToExcel():null;
    }
  } */
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
    this.dateRangeStart.value.setMonth(this.dateRangeStart.value.getMonth()-1);
    this.searchParametersFG = this.fb.group ({
      p_portfolios_list:  [],
      MP:null,
      p_report_date_start:null,
      p_report_date_end:null,
      // dataRangeSF : [this.dataRange, { validators:  Validators.required, updateOn: 'blur' }],
      p_report_currency:['840', { validators:  Validators.required}],
    });
  }
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  ngOnInit(): void {
    this.indexDBServiceS.getIndexDBStaticTables('getModelPortfolios').then ((data)=>{
      this.mp_strategies_list = data['data']
    })
    this.multiFilter = (data: PortfolioPerformnceData, filter: string) => {
      let filter_array = filter.split(',').map(el=>[el,1]);
      this.columnsToDisplay.forEach(col=>filter_array.forEach(fil=>{
        data[col]&&fil[0].toString().toUpperCase()===(data[col]).toString().toUpperCase()? fil[1]=0:null
      })
        );
      return !filter || filter_array.reduce((acc,val)=>acc+Number(val[1]),0)===0;
    };
    this.InvestmentDataService.getPortfolioPerformnceData().subscribe (positionsData =>{
      this.updateDataTable(positionsData);
    });  
    this.filters==undefined&&this.fullDataSource!==undefined? this.initialFilterOfDataSource(this.filters) : null;
    if (this.useGetClientsPortfolios===true) {
      this.subscriptions.add(this.InvestmentDataService.getClientsPortfolios().pipe(
        tap(() => this.dataSource? this.dataSource.data = null: null),
        tap(portfolios => portfolios.length===0?  this.filters = {null_data:true}: null),
        filter(portfolios=>portfolios.length>0)
      ).subscribe(portfoliosData=> {
        this.filters = {portfolio_code: portfoliosData.map(el=>el.code)};
        this.fullDataSource!==undefined? this.initialFilterOfDataSource(this.filters) : null;
      }));
    }
    if (this.readOnly===false) {
      this.subscriptions.add(this.AutoCompService.recieveCurrencyListReady().subscribe(()=>this.report_id_currency.updateValueAndValidity()));
      this.AutoCompService.getCurrencyList();
      this.filteredCurrenciesList = this.report_id_currency.valueChanges.pipe (
        startWith (''),
        distinctUntilChanged(),
        map(value => this.AutoCompService.filterList(value || '','currency'))
      );
    }
    this.multiFilter = (data: PortfolioPerformnceData, filter: string) => {
      let filter_array = filter.split(',').map(el=>[el,1]);
      this.columnsToDisplay.forEach(col=>filter_array.forEach(fil=>{
        data[col]&&fil[0].toString().toUpperCase()===(data[col]).toString().toUpperCase()? fil[1]=0:null
      })
        );
      return !filter || filter_array.reduce((acc,val)=>acc+Number(val[1]),0)===0;
    }
    // this.subscriptions.add(this.TreeMenuSevice.getActiveTab().subscribe(tabName=>this.activeTab=tabName));
  }
  resetSearchForm () {
    this.searchParametersFG.reset();
    this.portfolios=['ClearAll'];
  }
  setPortfoliosList(e:any) {
    this.InvestmentDataService.getPortfoliosListForMP(e.value,'getPortfoliosByMP_StrtgyID').subscribe(data=>{
      this.portfolios=['ClearAll',...data[0]['array_agg']]
      this.filterALL.nativeElement.value = e.value;
      // this.dataSource.filter = e.value.toLowerCase();
      // (this.dataSource.paginator)? this.dataSource.paginator.firstPage() : null;
    })
  }
  initialFilterOfDataSource (filter:any) {
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
    if (changes['filters']?.currentValue!==undefined&&this.fullDataSource!==undefined)  {
      this.initialFilterOfDataSource (changes['filters'].currentValue);
    }
  }
  updateDataTable (positionsData:PortfolioPerformnceData[]) {
    this.AutoCompService.fullCurrenciesList.length? this.currencyChanged(this.report_id_currency.value):null;
    this.fullDataSource=positionsData;
    this.dataSource  = new MatTableDataSource(positionsData);
    this.dataSource.filterPredicate =this.multiFilter
    // this.filterALL? this.filterALL.nativeElement.value=null : null;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.InvestmentDataService.sendPerformnceData(positionsData)
    // this.filters? this.initialFilterOfDataSource(this.filters) : null;
    // this.notNullCB?.checked===false? this.showZeroPortfolios(false):null;
  }
  submitQuery (reset:boolean=false, showSnackResult:boolean=true) {
    console.log( this.portfolios);
    let searchObj = reset?  {} : this.searchParametersFG.value;
    this.dataSource?.data? this.dataSource.data = null : null;
    searchObj.p_report_date_start = new Date (this.dateRangeStart.value).toLocaleDateString();
    searchObj.p_report_date_end = new Date (this.dateRangeEnd.value).toLocaleDateString();
    // searchObj.p_portfolios_list = this.portfolios.length? this.portfolios.map(el=>el.toUpperCase()) :null ;
    console.log( this.portfolios);
    of(this.portfolios.length).pipe(
      switchMap(portLength => portLength===1? this.InvestmentDataService.getPortfoliosListForMP('All','getPortfoliosByMP_StrtgyID'):from([[...this.portfolios]])),
      tap(ports=>searchObj.p_portfolios_list = ports.map(el=>el.toUpperCase())),
      switchMap(ports=>this.InvestmentDataService.getPortfolioPerformnceData(searchObj))
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
  addChips (el: any, column: string) {(['secid'].includes(column))? this.instruments.push(el):null;}
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
  // getTotals (col:string) {
  //   return (this.dataSource&&this.dataSource.data)?  this.dataSource.filteredData.map(el => el[col]).reduce((acc, value) => acc + Number(value), 0):0;
  // }
  exportToExcel() {
    let numberFields=['npv','roi_current_period','time_wighted_roi','last_npv','cash_flow','correction_rate','correction_rate_compound'];
    let dateFields=['report_date','period_start_date'];
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
    this.HandlingCommonTasksS.exportToExcel (dataToExport,"positionsData");  
  }
  get  idportfolios () {return this.searchParametersFG.get('p_portfolios_list') } 
  get  dateRangeStart () {return this.dataRange.get('dateRangeStart') } 
  get  dateRangeEnd () {return this.dataRange.get('dateRangeEnd') } 
  get  report_id_currency () {return this.searchParametersFG.get('p_report_currency') } 
  get  dataRangeSF () {return this.searchParametersFG.get('dataRangeSF') } 
}
