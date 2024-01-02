import { AfterViewInit, Component, EventEmitter, Output, ViewChild, Input, ChangeDetectionStrategy, ElementRef, ChangeDetectorRef, SimpleChanges, HostListener} from '@angular/core';
import { MatPaginator as MatPaginator} from '@angular/material/paginator';
import { MatSort} from '@angular/material/sort';
import { Observable, Subscription, empty, filter, from, map, of, startWith, switchMap, take, tap } from 'rxjs';
import { MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { allocation, orders, trades } from 'src/app/models/intefaces.model';
import { COMMA, ENTER} from '@angular/cdk/keycodes';
import { MatChipInputEvent} from '@angular/material/chips';
import { AbstractControl, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { formatNumber } from '@angular/common';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { HandlingCommonTasksService } from 'src/app/services/handling-common-tasks.service';
import { AuthService } from 'src/app/services/auth.service';
import { AppTradeService } from 'src/app/services/trades-service.service';
import { AtuoCompleteService } from 'src/app/services/auto-complete.service';
import { HandlingTableSelectionService } from 'src/app/services/handling-table-selection.service';
import { SelectionModel } from '@angular/cdk/collections';
import { MatCheckbox } from '@angular/material/checkbox';
import { AppTableAccEntriesComponent } from '../acc-entries-table.component/acc-entries-table.component';
import { AppAccountingService } from 'src/app/services/accounting.service';
import { AppAllocationService } from 'src/app/services/allocation.service';
import { TreeMenuSevice } from 'src/app/services/tree-menu.service';
import { AppInvestmentDataServiceService } from 'src/app/services/investment-data.service.service';
import { indexDBService } from 'src/app/services/indexDB.service';
@Component({
  selector: 'app-allocation-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './allocation-table.component.html',
  styleUrls: ['./allocation-table.component.scss'],
})
export class AppallocationTableComponent  implements AfterViewInit {
  FirstOpenedAccountingDate: string=null;
  accessState: string = 'none';
  private subscriptions = new Subscription()
  selectedRowIndex = -1;
  selectedRowID = -1;
  disabledControlElements: boolean = false;
  @Input() tableMode:string[]=['Parent'];
  @Input() dataToShow:allocation[];
  @Input() tradeData:trades;
  @Input() rowsPerPages:number = 20;
  @Input() filters:any;
  columnsToDisplay = ['select','id','portfolioname','qty', 'trade_amount', 'fifo','depo_account_balance', 'current_account_balance','id_order','id_bulk_order','entries','pl'];
  columnsHeaderToDisplay = ['ID', 'pCode','Quantity','Amount','FIFO','Depo','Balance', 'Order','Bulk','Entries','PL']
  dataSource: MatTableDataSource<allocation>;
  fullDataSource: allocation[];
  public selection = new SelectionModel<allocation>(true, []);
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('filterALL', { static: false }) filterALL: ElementRef;
  @ViewChild('allSelected', { static: false }) allSelected: MatCheckbox;
  @Output() public modal_principal_parent = new EventEmitter();
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  panelOpenStateSecond = false;
  instruments: string[] = ['ClearAll'];
  portfolios: string[] = ['ClearAll'];
  filterednstrumentsLists : Observable<string[]>;
  searchParametersFG: FormGroup;
  dataRange = new FormGroup ({
    dateRangeStart: new FormControl<Date | null>(null),
    dateRangeEnd: new FormControl<Date | null>(null),
  });
  dialogShowEntriesList: MatDialogRef<AppTableAccEntriesComponent>;
  multiFilter?: (data: any, filter: string) => boolean;
  activeTab:string='';
  tabsNames = ['Trades by Account','Allocation']
/*   @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) { 
    if (this.tabsNames.includes(this.activeTab)){
      event.altKey&&event.key==='r'? this.submitQuery(false,true):null;
      event.altKey&&event.key==='w'? this.exportToExcel():null;
    }
  } */
  constructor(
    private TreeMenuSeviceS: TreeMenuSevice,
    private InvestmentDataService:AppInvestmentDataServiceService, 
    private TradeService: AppTradeService,
    private AuthServiceS:AuthService,  
    private indexDBServiceS:indexDBService,
    private AllocationService: AppAllocationService,
    private AccountingDataService:AppAccountingService, 
    private ref: ChangeDetectorRef,
    private HandlingCommonTasksS:HandlingCommonTasksService,
    private SelectionService:HandlingTableSelectionService,
    private CommonDialogsService:HadlingCommonDialogsService,
    private AutoCompService:AtuoCompleteService,
    private fb:FormBuilder, 
    private dialog: MatDialog, 
  ) {
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToTradesData')[0].elementvalue;
    this.searchParametersFG = this.fb.group ({
      type:null,
      secidList: [],
      portfoliosList:  [],
      tdate : this.dataRange,
      id_bulk_order:null,
      price:null,
      qty:null,
    });
  }
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  ngOnInit(): void {
    if (this.accessState !== 'full' || this.filters?.disabled_controls===true) {
      this.disabledControlElements = true;
      this.filters?.disabled_controls? delete this.filters.disabled_controls : null;
    } 
    else {
      this.disabledControlElements = false
    };
    if (!this.tableMode.includes('Trade'))   {
      this.columnsToDisplay = ['select','id','portfolioname','trtype','qty', 'trade_amount','pl','id_order','id_bulk_order','entries','idtrade','secid','tdate','mp_name','price','id_price_currency'];
      this.columnsHeaderToDisplay = ['ID', 'pCode','Type','Quantity','Amount','PL', 'Order','Bulk','Entries','IDtrade','SecID','tDate','MP','Price','Curr']
    }
    let searchObj=null;
    let showBalances=false;
    let secidParam = null;
    switch (this.tableMode.join()) {
      case 'Trade':
        searchObj={idtrade:this.tradeData.idtrade,secid:this.tradeData.tidinstrument};
        showBalances=true;
        secidParam=this.tradeData.tidinstrument
      break;
      case 'Orders,Child':
        searchObj={id_bulk_order:this.filters.id_bulk_order};
      break;
      case 'Parent,Portfolio':
        this.disabledControlElements=true;
      break;
    }
    let getAllocationData$ = of(this.disabledControlElements);
    getAllocationData$.pipe (
      take(1),
      switchMap (readOnly=>readOnly===false? getAllocationData$.pipe(
          switchMap(()=>this.AccountingDataService.GetbParamsgfirstOpenedDate('GetbParamsgfirstOpenedDate')),
          tap(data=>this.FirstOpenedAccountingDate = new Date (data[0].FirstOpenedDate).toDateString())
        ):of(null)),
      switchMap(()=>this.TradeService.getAllocationInformation(searchObj,this.FirstOpenedAccountingDate,showBalances,secidParam))
    ).subscribe (allocationData =>{
          this.updateAllocationDataTable(allocationData);
          this.ref.markForCheck()
          setTimeout(() => {
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort; 
            this.dataSource.filterPredicate =this.multiFilter
          }, 200);
      });
  }
  ngAfterViewInit() {
    this.AutoCompService.getSecidLists();
    this.filters!==undefined&&this.fullDataSource!==undefined? this.initialFilterOfDataSource(this.filters) : null;
    this.filterednstrumentsLists = this.secidList.valueChanges.pipe(
      startWith(''),
      map(value => this.AutoCompService.filterList(value || '','secid'))
    );
    this.subscriptions.add(this.TreeMenuSeviceS.getActiveTab().subscribe(tabName=>this.activeTab=tabName));
    this.subscriptions.add(
      this.TradeService.getDeletedAllocationTrades().subscribe(deletedTrades=>{
        let arrayToDelete = [];
        this.dataSource.data.forEach((ds,index)=>{
          deletedTrades.findIndex(el=>Number(el.id)===Number(ds.id))!==-1? arrayToDelete.push(index):null
        })
        arrayToDelete.forEach((dlIndex,index)=> this.dataSource.data.splice(dlIndex-index,1));
        this.updateAllocationDataTable(this.dataSource.data)
    
      }),
    );
    this.subscriptions.add(this.InvestmentDataService.getClientsPortfolios().pipe(
      tap(() => this.dataSource? this.dataSource.data = null: null),
      tap(portfolios => portfolios.length===0?  this.filters = {null_data:true}: null),
      filter(portfolios=>portfolios.length>0)
    ).subscribe(portfoliosData=> {
      this.filters = {portfolioname: portfoliosData.map(el=>el.code)};
      this.fullDataSource!==undefined? this.initialFilterOfDataSource(this.filters) : null;
    }));
    this.multiFilter = (data: allocation, filter: string) => {
      let filter_array = filter.split(',').map(el=>[el,1]);
      let colForFilter=this.columnsToDisplay.slice(1)
      colForFilter.forEach(col=>filter_array.forEach(fil=>{
        data[col]!==null && fil[0].toString().toUpperCase()===(data[col]).toString().toUpperCase()? fil[1]=0:null
      }));
      return !filter || filter_array.reduce((acc,val)=>acc+Number(val[1]),0)===0;
    };
  }
  async initialFilterOfDataSource (filter:any) {
    this.filters?.disabled_controls? delete this.filters.disabled_controls : null;
    if (filter.mp_name) {
      let mpList = await this.indexDBServiceS.getIndexDBStaticTables('getModelPortfolios');
      mpList['data'].filter(el=>el.level===1).map(el=>el.name).includes(filter.mp_name)? null: delete filter.mp_name;
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
    changes?.['filters']?.currentValue!==undefined&&this.fullDataSource!==undefined? this.initialFilterOfDataSource (changes['filters'].currentValue) : null;
  }
  createAccountingForAllocation () {
    this.AllocationService.createAccountingForAllocation(this);
  }
  deleteAccountingForAllocatedTrades () {
    this.AllocationService.deleteAccountingForAllocatedTrades(this);
  }
  deleteAllocatedTrades () {
    this.AllocationService.deleteAllocatedTrades(this);
  }
  showEntries (idtrade : number) {
    this.dialogShowEntriesList = this.dialog.open(AppTableAccEntriesComponent ,{minHeight:'600px', minWidth:'1700px', autoFocus: false, maxHeight: '90vh'});
    this.dialogShowEntriesList.componentInstance.paramRowData = {idtrade:idtrade}; 
    this.dialogShowEntriesList.componentInstance.action = 'ViewEntriesByIdTrade';
    this.subscriptions.add(this.dialogShowEntriesList.componentInstance.modal_principal_parent.subscribe (()=>this.dialogShowEntriesList.close()));
  }
  showOrderDetails (id_bulk_order:number) {
    this.TradeService.getBulkOrderDetails(id_bulk_order).subscribe(data=>this.CommonDialogsService.jsonDataDialog(data[0],'Order Details'))
  }
  showTradeDetails (idtrade:number) {
    this.TradeService.getTradeDetails(idtrade).subscribe(data=>this.CommonDialogsService.jsonDataDialog(data[0],'Trade Details'))

  }
  excludeOrdersWithParent ():allocation[] {
    return this.dataSource.data.filter(allocation=>!allocation.idtrade)
  }
  updateAllocationDataTable (allocationData:allocation[]) {
    this.fullDataSource = allocationData;
    this.selection.clear();
    this.dataSource  = new MatTableDataSource(allocationData);
    this.filters!==undefined&&this.fullDataSource!==undefined? this.initialFilterOfDataSource(this.filters):null;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = this.multiFilter
    this.filterALL? this.filterALL.nativeElement.value=null : null;
    if (!this.tableMode.includes('Trade'))  {
      let orderAllocated = new Set(this.dataSource.data.map(el=>Number(el.id_bulk_order)))
      this.TradeService.sendAllocatedOrders([...orderAllocated].length? [...orderAllocated]:[0]);
    }
  }
  submitQuery (reset:boolean=false, showSnackResult:boolean=true) {
    this.AccountingDataService.GetbParamsgfirstOpenedDate('GetbParamsgfirstOpenedDate')
    .subscribe(data =>this.FirstOpenedAccountingDate = new Date (data[0].FirstOpenedDate).toDateString());
    return new Promise((resolve) => {
      let searchObj = reset?  {} : this.searchParametersFG.value;
      this.dataSource?.data? this.dataSource.data = null : null;
      this.tradeData?.idtrade? searchObj.idtrade=this.tradeData.idtrade:null;
      searchObj.secidList = [0,1].includes(this.instruments.length)&&this.instruments[0]==='ClearAll'? null : this.instruments.map(el=>el.toLocaleLowerCase())
      searchObj.portfoliosList = [0,1].includes(this.portfolios.length)&&this.portfolios[0]==='ClearAll'? null : this.portfolios.map(el=>el.toLocaleLowerCase())
      if (this.qty.value) {
        let qtyRange = this.HandlingCommonTasksS.toNumberRange(this.qty.value,this.qty,'qty');
        qtyRange? searchObj = {...searchObj, ... qtyRange} : searchObj.qty=null;
      } else {searchObj.qty=null};
      if (this.price.value) {
        let priceRange = this.HandlingCommonTasksS.toNumberRange(this.price.value,this.price,'price');
        priceRange? searchObj = {...searchObj, ... priceRange} : searchObj.price=null;
      } else  {searchObj.price=null};
      this.price.value? searchObj = {...searchObj, ... this.HandlingCommonTasksS.toNumberRange(this.price.value,this.price,'price')} :null;
      searchObj = {...searchObj, ...this.tdate.value? this.HandlingCommonTasksS.toDateRange(this.tdate, 'tdate') : null}
      this.TradeService.getAllocationInformation(
        this.tableMode.includes('Trade')? {idtrade:this.tradeData.idtrade,secid:this.tradeData.tidinstrument}:searchObj,
        this.FirstOpenedAccountingDate, 
        this.tableMode.includes('Trade'),
        this.tradeData?.idtrade? this.tradeData.tidinstrument:null
      ).subscribe(data => {
        this.updateAllocationDataTable(data)
        showSnackResult? this.CommonDialogsService.snackResultHandler({name:'success',detail: formatNumber (data.length,'en-US') + ' rows'}, 'Loaded ') : null;
        resolve(data) 
      });
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
  applyFilter(event: any) {
    const filterValue = (event.target as HTMLInputElement).value 
    this.dataSource.filter = filterValue.trim().toLowerCase();
    this.dataSource.paginator? this.dataSource.paginator.firstPage():null;
  }
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
  isAllSelected() { return this.SelectionService.isAllSelected(this.dataSource, this.selection)} 
  toggleAllRows(forceSelectAll:boolean=false) { return this.SelectionService.toggleAllRows(this.dataSource, this.selection,forceSelectAll)} 
  checkboxLabel(row?: orders): string {
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
  getTotals (col:string) {
    return (this.dataSource&&this.dataSource.data)?  this.dataSource.filteredData.map(el => el[col]).reduce((acc, value) => acc + Number(value), 0):0;
  }
  exportToExcel() {
    let numberFields=['id','qty', 'trade_amount','id_order','id_bulk_order','entries','idtrade','price','pl'];
    let dateFields=['tdate'];
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
    this.HandlingCommonTasksS.exportToExcel (dataToExport,"allocationData");  
  }
  get  type () {return this.searchParametersFG.get('type') } 
  get  tdate () {return this.searchParametersFG.get('tdate') } 
  get  vdate () {return this.searchParametersFG.get('vdate') } 
  get  secidList () {return this.searchParametersFG.get('secidList') } 
  get  portfoliosList () {return this.searchParametersFG.get('portfoliosList') } 
  get  qty () {return this.searchParametersFG.get('qty') } 
  get  price () {return this.searchParametersFG.get('price') } 
}
