import {AfterViewInit, Component, EventEmitter, Output, ViewChild, Input, ChangeDetectionStrategy, ElementRef, ChangeDetectorRef} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {Observable, Subscription, map, startWith } from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { allocation, objectStatus, orders, trades } from 'src/app/models/intefaces.model';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {MatChipInputEvent} from '@angular/material/chips';
import { AbstractControl, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { investmentNodeColorChild } from 'src/app/models/constants.model';
import { formatNumber } from '@angular/common';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { HandlingCommonTasksService } from 'src/app/services/handling-common-tasks.service';
import { AuthService } from 'src/app/services/auth.service';
import { AppTradeService } from 'src/app/services/trades-service.service';
import { AppTradeModifyFormComponent } from '../../forms/trade-form.component/trade-form.component';
import { AtuoCompleteService } from 'src/app/services/auto-complete.service';
import { HandlingTableSelectionService } from 'src/app/services/handling-table-selection.service';
import { SelectionModel } from '@angular/cdk/collections';
import { MatCheckbox } from '@angular/material/checkbox';
import { AppTableAccEntriesComponent } from '../acc-entries-table.component/acc-entries-table.component';
import { AppAccountingService } from 'src/app/services/accounting.service';
import { AppAllocationService } from 'src/app/services/allocation.service';
@Component({
  selector: 'app-allocation-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './allocation-table.component.html',
  styleUrls: ['./allocation-table.component.scss'],
})
export class AppallocationTableComponent  implements AfterViewInit {
  FirstOpenedAccountingDate: Date;
  accessState: string = 'none';
  orderStatuses:objectStatus[];
  ordersPermissions:string[];
  private subscriptions = new Subscription()
  selectedRowIndex = -1;
  selectedRowID = -1;
  disabledControlElements: boolean = false;
  @Input() tableMode:string[]=['Parent'];
  @Input() dataToShow:allocation[];
  @Input() tradeData:trades;
  @Input() allocationFilters:{secid:string, type:string};
  fullOrdersSet:allocation[];
  columnsToDisplay = ['select','id','portfolioname','qty', 'trade_amount','id_order','id_bulk_order','entries','idtrade','secid','tdate','trtype','price','id_price_currency'];
  columnsHeaderToDisplay = ['ID', 'pCode','Quantity','Amount', 'Order','Bulk','Entries','IDtrade','SecID','tDate','Type','Price','Curr']
  dataSource: MatTableDataSource<allocation>;
  public selection = new SelectionModel<allocation>(true, []);
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('filterALL', { static: false }) filterALL: ElementRef;
  @ViewChild('allSelected', { static: false }) allSelected: MatCheckbox;
  @Output() public modal_principal_parent = new EventEmitter();
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  investmentNodeColor = investmentNodeColorChild;
  panelOpenStateSecond = false;
  instruments: string[] = ['ClearAll'];
  filterednstrumentsLists : Observable<string[]>;
  searchParametersFG: FormGroup;
  dataRange = new FormGroup ({
    dateRangeStart: new FormControl<Date | null>(null),
    dateRangeEnd: new FormControl<Date | null>(null),
  });
  dialogOrderModify: MatDialogRef<AppTradeModifyFormComponent>;
  dialogShowEntriesList: MatDialogRef<AppTableAccEntriesComponent>;
  defaultFilterPredicate?: (data: any, filter: string) => boolean;
  secidfilter?: (data: any, filter: string) => boolean;
  constructor(
    private TradeService: AppTradeService,
    private AuthServiceS:AuthService,  
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
    this.orderStatuses = this.AuthServiceS.objectStatuses.filter(el =>el.id_object==='Order');
    this.ordersPermissions = this.AuthServiceS.accessRestrictions.filter(el=>el.elementid==='dorders_status_list')[0].elementvalue.split(',');
    this.disabledControlElements = this.accessState === 'full'? false : true;

    this.searchParametersFG = this.fb.group ({
      type:null,
      secidList: [],
      cptyList:  [],
      tdate : this.dataRange,
      price:null,
      qty:null,
    });
     this.TradeService.getOrderDataToUpdateTableSource().subscribe(data =>{
     let index =  this.dataSource.data.findIndex(elem=>elem.id===data.data[0].id)
/*       switch (data.action) {
        case 'Deleted':
          this.dataSource.data.splice(index,1)
        break;
        case 'Created':
          this.dataSource.data.unshift(data.data[0])
        break;
        case 'Updated':
          this.dataSource.data[index] = {...data.data[0]}
        break;
      } */
     this.dataSource.paginator = this.paginator;
     this.dataSource.sort = this.sort;
    })
  }
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  ngOnInit(): void {
    if (this.tableMode.includes('Trade'))   {
      this.columnsToDisplay = ['select','id','portfolioname','qty', 'trade_amount', 'depo_account_balance', 'current_account_balance','id_order','id_bulk_order','entries','idtrade','secid','tdate','trtype','price','id_price_currency'];
      this.columnsHeaderToDisplay = ['ID', 'pCode','Quantity','Amount','Position','Balance', 'Order','Bulk','Entries','IDtrade','SecID','tDate','Type','Price','Curr']
    }
    this.AccountingDataService.GetbParamsgfirstOpenedDate('GetbParamsgfirstOpenedDate').subscribe(data =>{ 
      this.FirstOpenedAccountingDate = data[0].FirstOpenedDate;
      this.TradeService.getAllocationInformation(this.tableMode.includes('Trade')? {idtrade:this.tradeData.idtrade}:null,new Date (this.FirstOpenedAccountingDate).toDateString(),this.tableMode.includes('Trade')).subscribe (allocationData => {
        this.updateAllocationDataTable(allocationData);
      this.ref.markForCheck()});  
    }); 
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
  }
  async ngAfterViewInit() {
    this.AutoCompService.getSecidLists();
    this.filterednstrumentsLists = this.secidList.valueChanges.pipe(
      startWith(''),
      map(value => this.AutoCompService.filterList(value || '','secid'))
    );
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
    this.dialogShowEntriesList.componentInstance.modal_principal_parent.subscribe ((item)=>{
      this.dialogShowEntriesList.close(); 
    });
  }
  applyFilter(event: any, col?:string) {
    this.dataSource.filterPredicate = col === undefined? this.defaultFilterPredicate : this.secidfilter
    const filterValue = event.hasOwnProperty('isUserInput')?  event.source.value :  (event.target as HTMLInputElement).value 
    !event.hasOwnProperty('isUserInput') || event.isUserInput ? this.dataSource.filter = filterValue.trim().toLowerCase() : null;
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage();}
  }
  excludeOrdersWithParent ():allocation[] {
    return this.dataSource.data.filter(allocation=>!allocation.idtrade)
  }
  updateAllocationDataTable (allocationData:allocation[]) {
    this.dataSource  = new MatTableDataSource(allocationData);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    let orderAllocated = new Set(this.dataSource.data.map(el=>Number(el.id_bulk_order)))
    this.TradeService.sendAllocatedOrders([...orderAllocated].length? [...orderAllocated]:[0]);
    this.defaultFilterPredicate = this.dataSource.filterPredicate;
    this.secidfilter = this.dataSource.filterPredicate;
  }
  async submitQuery (reset:boolean=false, showSnackResult:boolean=true) {
    this.AccountingDataService.GetbParamsgfirstOpenedDate('GetbParamsgfirstOpenedDate')
    .subscribe(data =>this.FirstOpenedAccountingDate = data[0].FirstOpenedDate);
    return new Promise((resolve, reject) => {
      let searchObj = reset?  {} : this.searchParametersFG.value;
      this.dataSource.data? this.dataSource.data = null : null;
      this.tradeData?.idtrade? searchObj.idtrade=this.tradeData.idtrade:null;
      searchObj.secidList = [0,1].includes(this.instruments.length)&&this.instruments[0]==='ClearAll'? null : this.instruments.map(el=>el.toLocaleLowerCase())
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
      this.TradeService.getAllocationInformation(this.tableMode.includes('Trade')? {idtrade:this.tradeData.idtrade}:searchObj,new Date (this.FirstOpenedAccountingDate).toDateString(),this.tableMode.includes('Trade')).subscribe(data => {
        this.updateAllocationDataTable(data)
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
    this.filterALL.nativeElement.value = el;
    this.dataSource.filter = el.trim().toLowerCase();
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
  openOrderModifyForm (action:string, element:any) {
/*     this.dialogOrderModify = this.dialog.open (AppTradeModifyFormComponent,{minHeight:'600px', minWidth:'40vw', autoFocus: false, maxHeight: '90vh'})
    this.dialogOrderModify.componentInstance.action = action;
    this.dialogOrderModify.componentInstance.data = action ==='Create'? null :element; */
  }
  getTotals (col:string) {
    return (this.dataSource&&this.dataSource.data)?  this.dataSource.data.map(el => el[col]).reduce((acc, value) => acc + Number(value), 0):0;
  }
  exportToExcel() {this.HandlingCommonTasksS.exportToExcel (this.dataSource.data.map(el=>{
    return {
      IDtrade:Number(el['idtrade']),
      TradeDate:new Date(el['tdate']),
      Type:(el['trtype']),
      Secid:(el['tidinstrument']),
      SecidName:(el['secid_name']),
      ValueDate:new Date(el['vdate']),
      Price:Number(el['price']),
      PriceCurrency:(el['id_price_currency']),
      CounterParty:(el['cpty']),
      Quantity:Number(el['qty']),
      TradeAmount:Number(el['trade_amount']),
      SettlementCurrency:(el['id_settlement_currency']),
      PriceType:Number(el['price_type']),
      Facevalue:Number(el['facevalue']),
      Faceunit:(el['faceunit']),
      SecidType:(el['secid_type']),
    }
  }),"ordersData")  }
  get  type () {return this.searchParametersFG.get('type') } 
  get  tdate () {return this.searchParametersFG.get('tdate') } 
  get  vdate () {return this.searchParametersFG.get('vdate') } 
  get  secidList () {return this.searchParametersFG.get('secidList') } 
  get  cptyList () {return this.searchParametersFG.get('cptyList') } 
  get  qty () {return this.searchParametersFG.get('qty') } 
  get  price () {return this.searchParametersFG.get('price') } 
}
