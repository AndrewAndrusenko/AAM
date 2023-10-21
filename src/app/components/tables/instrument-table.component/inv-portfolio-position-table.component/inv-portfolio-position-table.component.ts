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
  selector: 'app-inv-portfolio-position-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inv-portfolio-position-table.component.html',
  styleUrls: ['./inv-portfolio-position-table.component.scss'],
})
export class AppaInvPortfolioPositionTableComponent  implements AfterViewInit {
  accessState: string = 'none';
  private subscriptions = new Subscription()
  disabledControlElements: boolean = false;
  @Input() rowsPerPages:number = 15;
  @Input() filters:any;
  columnsToDisplay = ['portfolio_code','secid','mp_name','fact_weight','current_balance','mtm_positon','weight','planned_position','order_amount','mtm_rate','total_pl','roi','pl','unrealizedpl','cost_in_position','mtm_date','order_type','order_qty','orders_unaccounted_qty','mtm_dirty_price','cross_rate','strategy_name','rate_date'];
  columnsHeaderToDisplay = ['Code','SecID','MP','Fact %','Balance','PositionMTM','MP %','MP_Position','Deviation','MTM_Rate','Total PL','ROI','FIFO PL','MTM PL','Position Cost','MTM_Date','TypeBS','Deviation Qty','Qty in Active Orders ','MTM_Dirty','CurRate','Strategy','CurDate']
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
      console.log('mp',this.mp_strategies_list);
    })

    this.multiFilter = (data: portfolioPositions, filter: string) => {
      let filter_array = filter.split(',').map(el=>[el,1]);
      this.columnsToDisplay.forEach(col=>filter_array.forEach(fil=>{
        console.log('data',col,data[col]);
        data[col]&&fil[0].toString().toUpperCase()===(data[col]).toString().toUpperCase()? fil[1]=0:null
      })
        );
      return !filter || filter_array.reduce((acc,val)=>acc+Number(val[1]),0)===0;
    };
    this.InvestmentDataService.getPortfoliosPositions(this.searchParametersFG.value).subscribe (positionsData =>{
      this.updatePositionsDataTable(positionsData);
    });  
    this.AutoCompService.getCurrencyList().then(()=>{
      this.report_id_currency.setValidators([this.AutoCompService.currencyValirator(),Validators.required]);
    });
  }
  async ngAfterViewInit() {
    this.subscriptions.add(this.TreeMenuSevice.getActiveTab().subscribe(tabName=>this.activeTab=tabName));
    this.AutoCompService.getSecidLists();
    console.log('ngAfterViewInit',);
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
    console.log('e',e.value);
    this.InvestmentDataService.getPortfoliosListForMP(e.value,'getPortfoliosByMP_StrtgyID').subscribe(data=>{
      console.log('data',data);
      this.portfolios=data[0]['array_agg']
      this.filterALL.nativeElement.value = e.value;
      this.dataSource.filter = e.value.toLowerCase();
      (this.dataSource.paginator)? this.dataSource.paginator.firstPage() : null;
    }
    )
  }
  initialFilterOfDataSource (filter:any) {
   Object.keys(filter).every(key=>{
    this.dataSource.data = this.fullDataSource.filter(el=>el[key]===filter[key])
    if (this.dataSource.data.length) {return false}  else return true;
   })
  }
  ngOnChanges(changes: SimpleChanges) {
    console.log('changes',changes);
    changes['filters'].currentValue==undefined&&this.fullDataSource!==undefined?  this.initialFilterOfDataSource (changes['filters'].currentValue):null;
  }
  applyFilter(event: any, col?:string) {
    this.dataSource.filterPredicate = col === undefined? this.defaultFilterPredicate : this.multiFilter
    const filterValue = event.hasOwnProperty('isUserInput')?  event.source.value :  (event.target as HTMLInputElement).value 
    !event.hasOwnProperty('isUserInput') || event.isUserInput ? this.dataSource.filter = filterValue.trim().toLowerCase() : null;
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage();}
  }
 
  updatePositionsDataTable (positionsData:portfolioPositions[]) {
    this.fullDataSource=positionsData;
    this.dataSource  = new MatTableDataSource(positionsData);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.filters? this.initialFilterOfDataSource(this.filters) : null;
    this.dataSource.filterPredicate =this.multiFilter
    this.defaultFilterPredicate = this.dataSource.filterPredicate;
    this.multiFilter = this.dataSource.filterPredicate;

  }
  async submitQuery (reset:boolean=false, showSnackResult:boolean=true) {
    return new Promise((resolve, reject) => {
      let searchObj = reset?  {} : this.searchParametersFG.value;
      this.dataSource.data? this.dataSource.data = null : null;
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
    if (event.target.textContent.trim() === 'ClearAll cancel') {
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
}