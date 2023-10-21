import {AfterViewInit, Component, EventEmitter, Output, ViewChild, Input, ChangeDetectionStrategy, ElementRef, SimpleChanges} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {Observable, Subscription, distinctUntilChanged, map, startWith, switchMap, tap } from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {portfolioPositions, trades } from 'src/app/models/intefaces.model';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {MatChipInputEvent} from '@angular/material/chips';
import {AbstractControl, FormBuilder, Validators, FormGroup } from '@angular/forms';
import {formatNumber } from '@angular/common';
import {HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import {HandlingCommonTasksService } from 'src/app/services/handling-common-tasks.service';
import {AuthService } from 'src/app/services/auth.service';
import {AtuoCompleteService } from 'src/app/services/auto-complete.service';
import {AppInvestmentDataServiceService } from 'src/app/services/investment-data.service.service';
import { HostListener } from '@angular/core';
import { indexDBService } from 'src/app/services/indexDB.service';
import { TreeMenuSevice } from 'src/app/services/tree-menu.service';
@Component({
  selector: 'app-inv-generate-orders-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inv-generate-orders-table.component.html',
  styleUrls: ['./inv-generate-orders-table.component.scss'],
})
export class AppInvGenerateOrdersTable  implements AfterViewInit {
  accessState: string = 'none';
  private subscriptions = new Subscription()
  disabledControlElements: boolean = false;
  @Input() rowsPerPages:number = 15;
  @Input() filters:any;
  columnsToDisplay = ['portfolio_code','secid','fact_weight','weight','order_amount','mtm_positon','planned_position','mtm_rate','mtm_date','orders_unaccounted_qty','mp_name','strategy_name','order_qty','current_balance','order_type','mtm_dirty_price','cross_rate','rate_date'];
  columnsHeaderToDisplay = ['Code','SecID','Fact %','MP %','Deviation','CurrentMTM','Targeted_MP','MTM_Rate','MTM_Date','Active Orders','MP','Strategy','Deviation Qty','Balance','TypeBS','MTM_Dirty','CurRate','CurDate']
  dataSource: MatTableDataSource<portfolioPositions>;
  fullDataSource: portfolioPositions[];
  @ViewChild('filterALL', { static: false }) filterALL: ElementRef;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @Output() public modal_principal_parent = new EventEmitter();
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  instruments: string[] = ['ClearAll'];
  portfolios: string[] = ['ClearAll'];
  filterednstrumentsLists : Observable<string[]>;
  searchParametersFG: FormGroup;
  defaultFilterPredicate?: (data: any, filter: string) => boolean;
  multiFilter?: (data: any, filter: string) => boolean;
  filteredCurrenciesList: Observable<string[]>;
  mp_strategies_list: string[]=[];
  activeTab:string='';
  tabsNames = ['Portfolio Positions']
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) { 
    if (this.tabsNames.includes(this.activeTab)){
      event.altKey&&event.key==='r'? this.submitQuery(false,true):null;
      event.altKey&&event.key==='w'? this.exportToExcel():null;
    }
  }
  constructor(
    private TreeMenuSevice: TreeMenuSevice,
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
      deviation:0.01,
      report_date : [new Date(), { validators:  Validators.required, updateOn: 'blur' }],
      report_id_currency:[840, { validators:  Validators.required, updateOn: 'blur' }],
    });
  }
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  ngOnInit(): void {
    this.indexDBServiceS.getIndexDBStaticTables('getModelPortfolios').then ((data)=>{
      this.mp_strategies_list = data['data']
    })
    this.multiFilter = (data: portfolioPositions, filter: string) => {
      let filter_array = filter.split(',').map(el=>[el,1]);
      this.columnsToDisplay.forEach(col=>filter_array.forEach(fil=>{
        data[col]&&fil[0].toString().toUpperCase()===(data[col]).toString().toUpperCase()? fil[1]=0:null
      })
        );
      return !filter || filter_array.reduce((acc,val)=>acc+Number(val[1]),0)===0;
    };
    this.AutoCompService.getCurrencyList().then(()=>{
      this.report_id_currency.setValidators([this.AutoCompService.currencyValirator(),Validators.required]);
    });
  }
  async ngAfterViewInit() {
    this.subscriptions.add(this.TreeMenuSevice.getActiveTab().subscribe(tabName=>this.activeTab=tabName));
    this.AutoCompService.getSecidLists();
    this.filters==undefined&&this.fullDataSource!==undefined? this.initialFilterOfDataSource(this.filters) : null;
    this.filterednstrumentsLists = this.secidList.valueChanges.pipe(
      startWith(''),
      distinctUntilChanged(),
      map(value => this.AutoCompService.filterList(value || '','secid'))
    );
    this.filteredCurrenciesList = this.report_id_currency.valueChanges.pipe (
      startWith (''),
      distinctUntilChanged(),
      map(value => this.AutoCompService.filterList(value || '','currency'))
    );
  }
  setPortfoliosList(e:any) {
    this.InvestmentDataService.getPortfoliosListForMP(e.value,'getPortfoliosByMP_StrtgyID').subscribe(data=>{
      this.portfolios=['ClearAll',...data[0]['array_agg']];
      this.dataSource?.paginator? this.dataSource.paginator.firstPage() : null;
    })
  }
  initialFilterOfDataSource (filter:any) {
   Object.keys(filter).every(key=>{
    this.dataSource.data = this.fullDataSource.filter(el=>el[key]===filter[key])
    if (this.dataSource.data.length) {return false}  else return true;
   })
  }
  ngOnChanges(changes: SimpleChanges) {
    changes['filters'].currentValue==undefined&&this.fullDataSource!==undefined?  this.initialFilterOfDataSource (changes['filters'].currentValue):null;
  }
  createOrders (){
    console.log('sec',this.portfolios)
    console.log('sec',this.instruments)
  }
  applyFilter(event: any, col?:string) {
    this.dataSource.filterPredicate = col === undefined? this.defaultFilterPredicate : this.multiFilter
    const filterValue = event.hasOwnProperty('isUserInput')?  event.source.value :  (event.target as HTMLInputElement).value 
    !event.hasOwnProperty('isUserInput') || event.isUserInput ? this.dataSource.filter = filterValue.trim().toLowerCase() : null;
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage();}
  }
  updatePositionsDataTable (positionsData:portfolioPositions[]) {
    this.MP.value? positionsData = positionsData.filter(el=>el.mp_name===this.MP.value||el.strategy_name===this.MP.value) : null;
    this.fullDataSource=positionsData;
    this.dataSource  = new MatTableDataSource(positionsData);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.instruments=['ClearAll',...[...new Set(this.dataSource.data.map(el=>el.secid))]];
    this.filters? this.initialFilterOfDataSource(this.filters) : null;
    this.dataSource.filterPredicate =this.multiFilter
    this.defaultFilterPredicate = this.dataSource.filterPredicate;
    this.multiFilter = this.dataSource.filterPredicate;
  }
  async submitQuery (reset:boolean=false, showSnackResult:boolean=true) {
    return new Promise((resolve, reject) => {
      let searchObj = reset?  {} : this.searchParametersFG.value;
      this.dataSource?.data? this.dataSource.data = null : null;
      searchObj.secidList = [0,1].includes(this.instruments.length)&&this.instruments[0]==='ClearAll'? null : this.instruments.map(el=>el.toLocaleLowerCase())
      searchObj.idportfolios = [0,1].includes(this.portfolios.length)&&this.portfolios[0]==='ClearAll'? null : this.portfolios.map(el=>el.toLocaleLowerCase())
      this.InvestmentDataService.getPortfoliosPositions(searchObj).subscribe(data => {
        this.updatePositionsDataTable(data)
        showSnackResult? this.CommonDialogsService.snackResultHandler({name:'success',detail: formatNumber (data.length,'en-US') + ' rows'}, 'Loaded ') : null;
        resolve(data) 
      });
    });
  }
  changedValueofChip (value:string, chipArray:string[],control:AbstractControl) {
    chipArray[chipArray.length-1] = value;
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
    if (['ClearAll cancel','ClearAll'].includes(event.target.textContent.trim())) {chipArray = ['ClearAll']};
    return chipArray;
  }
  addChips (el: any, column: string) {(['secid'].includes(column))? this.instruments.push(el):null;}
  updateFilter (el: any) {
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
  exportToExcel() {
    let numberFields=['total_pl','roi','pl','unrealizedpl','cost_in_position','idportfolio','fact_weight','current_balance','mtm_positon','weight','planned_position','order_amount','order_qty','mtm_rate','cross_rate','mtm_dirty_price','pl'];
    let dateFields=['mtm_date','rate_date'];
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
  get  secidList () {return this.searchParametersFG.get('secidList') } 
  get  idportfolios () {return this.searchParametersFG.get('idportfolios') } 
  get  report_date () {return this.searchParametersFG.get('report_date') } 
  get  report_id_currency () {return this.searchParametersFG.get('report_id_currency') } 
  get  deviation () {return this.searchParametersFG.get('deviation') } 
  get  secArray () {return this.searchParametersFG.get('secArray') } 
  get  MP () {return this.searchParametersFG.get('MP') } 
}