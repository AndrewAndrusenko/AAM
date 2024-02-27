import {AfterViewInit, Component, EventEmitter, Output, ViewChild, Input, ChangeDetectionStrategy, ElementRef, HostListener, SimpleChanges} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {Observable, Subscription, filter, map, startWith, switchMap, tap } from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { objectStatus, orders } from 'src/app/models/interfaces.model';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {MatChipInputEvent} from '@angular/material/chips';
import { AbstractControl, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { investmentNodeColorChild, additionalLightGreen } from 'src/app/models/constants.model';
import { formatNumber } from '@angular/common';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { HandlingCommonTasksService } from 'src/app/services/handling-common-tasks.service';
import { AuthService } from 'src/app/services/auth.service';
import { AppTradeService } from 'src/app/services/trades-service.service';
import { AppTradeModifyFormComponent } from '../../forms/trade-form.component/trade-form.component';
import { AtuoCompleteService } from 'src/app/services/auto-complete.service';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { HandlingTableSelectionService } from 'src/app/services/handling-table-selection.service';
import { SelectionModel } from '@angular/cdk/collections';
import { indexDBService } from 'src/app/services/indexDB.service';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatSelect } from '@angular/material/select';
interface filtersForTable {
  idportfolio?:number[],
  only_clients?:boolean,
  filter_dataset?:boolean
  rest?:boolean
  null_data?:boolean
  mp_name?:string[],
  strategy_name?:string[],
}
@Component({
  selector: 'app-orders-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './orders-table.component.html',
  styleUrls: ['./orders-table.component.scss'],
  animations: [
    trigger('detailExpand',
    [   state('collapsed, void', style({ height: '0px'})),
        state('expanded', style({ height: '*' })),
        transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        transition('expanded <=> void', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ])
  ],
})
export class AppOrderTableComponent {
  accessState: string = 'none';
  orderStatuses:objectStatus[];
  ordersPermissions:string[];
  private subscriptions = new Subscription()
  selectedRowIndex = -1;
  selectedRowID = -1;
  disabledControlElements: boolean = false;
  @Input() tableMode:string[];
  @Input() dataToShow:orders[];
  @Input() bulkOrder:number;
  @Input() allocationFilters:{secid:string, type:string,bulkorders:string[]};
  @Input() filters:filtersForTable;
  @Input() UI_min:boolean=true;
  multiFilter?: (data: orders, filter: string) => boolean;
  columnsToDisplay = ['select','id','ordertype','type','secid','security_group_name','mp_name','qty','price','amount','unexecuted','status','portfolioname','idcurrency','generated','action','parent_order','allocated'];
  columnsHeaderToDisplay = ['ID','Order','Type','SecID','Group','MP','Quantity','Price','Amount','Unexecuted','Status','Portfolio','Currency','Created','Action','BulkID','Allocated']
  expandedElement: orders  | null;
  expandAllowed: boolean = true;
  columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
  fullOrdersSet:orders[];
  fullfilteredOrdersSet:orders[];
  dataSource: MatTableDataSource<orders>;
  public selection = new SelectionModel<orders>(true, []);
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  public dialogTradeModify: MatDialogRef<AppTradeModifyFormComponent>
  @ViewChild(MatCheckbox) showClientOrdersCB: MatCheckbox;
  @ViewChild('filterALL', { static: false }) filterALL: ElementRef;
  @ViewChild('allSelected', { static: false }) allSelected: MatCheckbox;
  @Output() public modal_principal_parent = new EventEmitter();
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  investmentNodeColor = investmentNodeColorChild;
  panelOpenStateSecond = false;
  panelOpenStateFirst = false;
  instruments: string[] = ['ClearAll'];
  filterednstrumentsLists : Observable<string[]>;
  searchParametersFG: FormGroup;
  dataRange = new FormGroup ({
    dateRangeStart: new FormControl<Date | null>(null),
    dateRangeEnd: new FormControl<Date | null>(null),
  });
  dialogOrderModify: MatDialogRef<AppTradeModifyFormComponent>;
  activeTab:string='';
  tabsNames = ['Orders']
/*   @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) { 
    if (this.tabsNames.includes(this.activeTab)){
      event.altKey&&event.key==='r'? this.submitQuery(false,true):null;
      event.altKey&&event.key==='w'? this.exportToExcel():null;
    }
  } */
  constructor(
    public TradeService: AppTradeService,
    private AuthServiceS:AuthService,  
    private HandlingCommonTasksS:HandlingCommonTasksService,
    private SelectionService:HandlingTableSelectionService,
    private CommonDialogsService:HadlingCommonDialogsService,
    private indexDBServiceS:indexDBService,
    private AutoCompService:AtuoCompleteService,
    private dialog: MatDialog,
    private fb:FormBuilder, 
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
      status:null,
      idportfolio:null
    });
    this.multiFilter = (data: orders, filter: string) => {
      let filter_array = filter.split(',').map(el=>[el,1]);
      let colForFilter=this.columnsToDisplay.slice(1)
      colForFilter.forEach(col=>filter_array.forEach(fil=>{
        data[col]!==null && fil[0].toString().toUpperCase()===(data[col]).toString().toUpperCase()? fil[1]=0:null
      }));
      return !filter || filter_array.reduce((acc,val)=>acc+Number(val[1]),0)===0;
    };
  }
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  ngOnInit(): void {
    this.indexDBServiceS.getIndexDBStaticTables('getObjectStatuses');
    if (this.tableMode.includes('Allocation')) {
      this.columnsToDisplayWithExpand = ['select','id','ordertype','type','secid','qty','price','amount','unexecuted','status','allocated','portfolioname','idcurrency','generated','expand'];
    } else {
      this.columnsToDisplayWithExpand = ['select','id','ordertype','type','secid','security_group_name','mp_name','qty','price','amount','unexecuted','status','portfolioname','idcurrency','generated','action','parent_order'];
    }
    switch (this.tableMode.join()) {
      case 'Parent':
        this.TradeService.getOrderInformation({status:['created','confirmed','in_execution','executed']}).subscribe (ordersData => {
          this.updateordersDataTable(ordersData);
        })
        this.AutoCompService.getSecidLists();
        this.filterednstrumentsLists = this.secidList.valueChanges.pipe(
          startWith(''),
          map(value => this.AutoCompService.filterList(value || '','secid'))
        );
      break;
      case 'Allocation,Child':
      case 'Child':
        this.dataSource  = new MatTableDataSource(this.dataToShow.filter(el=>el.parent_order===Number(this.bulkOrder)))
      break;
      case 'Allocation,Parent':
        this.TradeService.getOrderInformation({
          type:this.allocationFilters.type,
          secidList:[this.allocationFilters.secid.toLowerCase()],
          status:['confirmed','in_execution','executed']}).subscribe (ordersData => this.updateordersDataTable(ordersData));
        this.subscriptions.add(
          this.TradeService.getReloadOrdersForExecution().pipe(
          switchMap(()=>this.TradeService.getOrderInformation({
            type:this.allocationFilters.type,
            secidList:[this.allocationFilters.secid.toLowerCase()],
            status:['confirmed','in_execution','executed']}))
          ).subscribe (ordersData =>this.updateordersDataTable(ordersData)));
      break;
      case 'Parent,Per_Portfolio':
        this.TradeService.getOrderInformation({
          idportfolio:this.filters.idportfolio[0]}).subscribe (ordersData => this.updateordersDataTable(ordersData));
      break;
    }
    if (this.tableMode.includes('Child')) {
      this.columnsToDisplayWithExpand.splice(this.columnsToDisplayWithExpand.indexOf('action'),1);
      this.TradeService.getUpdateOrdersChangedStatus().subscribe(data=>{
        data.bulksForUpdate.includes(this.bulkOrder)? this.updateSatus(data.data) : null;
      })
    }
    // this.subscriptions.add(this.TreeMenuSevice.getActiveTab().subscribe(tabName=>this.activeTab=tabName));

  }
  ngOnChanges(changes: SimpleChanges): void {
    switch (this.tableMode.join()) {
      case 'Parent,Per_Portfolio':
        this.TradeService.getOrderInformation({
          idportfolio:this.filters.idportfolio[0]}).subscribe (ordersData => this.updateordersDataTable(ordersData));
      break;
      default:
        if (changes['filters']?.currentValue!==undefined&&this.fullOrdersSet!==undefined)  {
          this.initialFilterOfDataSource (changes['filters'].currentValue);
          this.dataSource.data = this.excludeOrdersWithParent()
        }
      break;
    }
  }
  updateordersDataTable (ordersData:orders[]) {
    this.fullOrdersSet = ordersData;
    this.dataSource  = new MatTableDataSource(ordersData);
    this.dataSource.paginator = this.paginator;
    this.dataSource.filterPredicate=this.multiFilter;
    this.dataSource.sort = this.sort;
    switch (this.tableMode.join()) {
      case 'Parent,Per_Portfolio':
      break;
      default:
        this.filters!==undefined&&this.fullOrdersSet!==undefined? this.initialFilterOfDataSource(this.filters):null;
        this.dataSource.data = this.excludeOrdersWithParent()
      break;
    }
  }
  submitQuery (reset:boolean=false,showSnackResult:boolean=true) {
    let searchObj = reset?  {status:['created','confirmed','in_execution','executed']} : this.searchParametersFG.value;
    this.dataSource.data? this.dataSource.data = null : null;
    searchObj.secidList = [0,1].includes(this.instruments.length)&&this.instruments[0]==='ClearAll'? null : this.instruments.map(el=>el.toLocaleLowerCase())
    if (this.qty.value) {
      let qtyRange = this.HandlingCommonTasksS.toNumberRange(this.qty.value,this.qty,'qty');
      qtyRange? searchObj = {...searchObj, ... qtyRange} : searchObj.qty=null;
    } else {searchObj.qty=null};
    if (this.price.value) {
      let priceRange = this.HandlingCommonTasksS.toNumberRange(this.price.value,this.price,'price');
      priceRange? searchObj = {...searchObj, ... priceRange} : searchObj.price=null;
    } else  {searchObj.price=null};
    switch (this.tableMode.join()) {
      case 'Parent,Per_Portfolio':
        searchObj= {idportfolio:this.filters.idportfolio}
      break;
      case 'Allocation,Parent': 
        searchObj= {
          type:this.allocationFilters.type,
          secidList:[this.allocationFilters.secid.toLowerCase()],
          status:['confirmed','in_execution','executed']
        }  
    }
    this.price.value? searchObj = {...searchObj, ... this.HandlingCommonTasksS.toNumberRange(this.price.value,this.price,'price')} :null;
    searchObj = {...searchObj, ...this.tdate.value? this.HandlingCommonTasksS.toDateRange(this.tdate, 'tdate') : null}
    this.TradeService.getOrderInformation(searchObj).subscribe(data => {
      this.updateordersDataTable(data)
      showSnackResult? this.CommonDialogsService.snackResultHandler({name:'success',detail: formatNumber (data.length,'en-US') + ' rows'}, 'Loaded '):null;
    });
  }
  initialFilterOfDataSource (filter:filtersForTable) {
    this.showClientOrdersCB.checked= false;
    if (filter?.rest===true) {
      this.dataSource.data = this.fullOrdersSet;
      return;
    }
    if (filter?.null_data===true) {
      this.dataSource.data=null;
    } else {
    Object.keys(filter).every(key=>{
      this.dataSource.data = this.fullOrdersSet.filter(el=>filter[key].includes(el[key]))
      if (this.dataSource.data.length) {return false}  else return true;
     })
    }
  }

  filterAllocatedOrders(allocOrders:number[]) {
    this.updateordersDataTable(this.dataSource.data.filter(el=>allocOrders.includes(el.id)));
  }
  deleteClientOrders (){
    let clientOrdersIds:number[] = this.selection.selected
    .filter(el=>el.ordertype==='Client')
    .map(el=> Number(el.id))
    if (clientOrdersIds.length>0) {
      this.CommonDialogsService.confirmDialog('Delete Orders','Delete').pipe(
        filter(isConfirmed=>isConfirmed.isConfirmed),
        switchMap(()=>this.TradeService.deleteOrders(clientOrdersIds))
      ).subscribe(data => {
        this.CommonDialogsService.snackResultHandler(data,'Delete ')
        this.selection.clear();
        data.hasOwnProperty('name')? null: this.submitQuery();
      })
    } else {
      this.CommonDialogsService.snackResultHandler({name:'error',detail:'No orders have been selected'})
    }
  }
  checkChangeStatus(changeType:string,currentStatus:string):boolean {
    this.orderStatuses = this.AuthServiceS.objectStatuses.filter(el =>el.id_object==='Order');
    let index =  this.orderStatuses.findIndex(el=>el.status_code===currentStatus);
    return (!index&&changeType==='down')||(index===this.orderStatuses.length-1&&changeType==='up')? false : true;
  }
  setStatus (changeType:string,currentStatus:string) :string {
    this.orderStatuses = this.AuthServiceS.objectStatuses.filter(el =>el.id_object==='Order');
    let factor = changeType==='up'? 1 : -Math.abs(1) 
    return this.orderStatuses[this.orderStatuses.findIndex(el=>el.status_code===currentStatus) + factor].status_code
  }
  updateSatus (data:orders[]) {
    data.forEach(el=>{
      let i=this.dataSource.data.findIndex(ds=>[ds.id,ds.parent_order].includes(el.id))
      i!==-1? this.dataSource.data[i].status = el.status:null;
    });
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  changeOrderStatus (newStatus:string,bulksForUpdate:number[]) {
    this.expandAllowed=false;
    if (this.ordersPermissions.includes(newStatus)) { 
      this.TradeService.changeOrderStatus(newStatus,bulksForUpdate.map(el=>Number(el))).subscribe(data=>{
        this.updateSatus(data);
        this.TradeService.sendUpdateOrdersChangedStatus(data,bulksForUpdate)
      })
    } else {
      this.CommonDialogsService.snackResultHandler({name:'error', detail: 'There is no permission for operation'}, 'ChangeStatus')
    }
  }
  unmergeBulk (id?:number[]) { 
    let bulkOrdersIds:number[] = !id? this.selection.selected.map(el=>el.ordertype==='Bulk'? Number(el.id):null) : id.map(el=>Number(el));
    if (bulkOrdersIds.length) {
      this.TradeService.unmergerBulkOrder(bulkOrdersIds).subscribe(data => {
        this.CommonDialogsService.snackResultHandler(data,'Unmerge ')
        this.selection.clear();
        data.hasOwnProperty('name')? null: this.submitQuery(true);
      })
    } else {
      this.CommonDialogsService.snackResultHandler({name:'error',detail:'No orders have been selected'})
    }
  }
  createBulkOrders () {
    this.selection.selected.filter(el=>['created','confirmed'].includes(el.status)).length? this.TradeService.createBulkOrder(this.selection.selected.map(el=>el.ordertype==='Client'? Number(el.id):null)).subscribe(data => {
      this.selection.clear();
      this.submitQuery(true);
    }):this.CommonDialogsService.snackResultHandler({name:'error',detail:'Confirmed or created orders have not been selected'},'CreateBulkOrder');
  }
  openTradeForm (order:orders) {
    let mappedData = [
      {trtype:order.type},
      {tidinstrument:order.secid},
      {id_price_currency:order.idcurrency},
      {id_settlement_currency:order.idcurrency},
      {secidAutocolmplete:false}
    ];
    order.price_type.toString()==="2"? mappedData[4].secidAutocolmplete=true:null;
    Object.assign(order, ...mappedData);
    this.dialogTradeModify = this.dialog.open (AppTradeModifyFormComponent,{minHeight:'600px', minWidth:'60vw', maxWidth:'80vw', maxHeight: '90vh'})
    this.dialogTradeModify.componentInstance.action = 'Create_Example';
    this.dialogTradeModify.componentInstance.tabIndex=0;
    this.dialogTradeModify.componentInstance.data = order
  }
  toggleAllStatuses (statusSelect:MatSelect) {
    statusSelect.value.length===this.orderStatuses.length? statusSelect.value=[] : statusSelect.value=['all',...this.orderStatuses.map(el=>el.status_code,0)]
  }
  filterByStatus (statuses:MatSelect) {
    let statusArray=statuses.value
    statusArray.length===this.orderStatuses.length+1? this.dataSource.data = this.fullOrdersSet :  this.dataSource.data = this.fullOrdersSet.filter(el=>statusArray.includes(el.status))
    this.fullfilteredOrdersSet = this.dataSource.data;
    this.showClientOrdersCB.checked===false? this.dataSource.data = this.excludeOrdersWithParent():null;
    this.showClientOrdersCB.checked===true? this.showClientOrders(this.showClientOrdersCB.checked):null;
    statuses.close();
  }
  applyOrderTypeFilter (value:string){
    this.dataSource.data = value!=='All'? this.fullOrdersSet.filter(el=>value==='Bulk'? el.ordertype===value:el.ordertype===value&&!el.parent_order) : this.fullOrdersSet.filter(order=>!order.parent_order)
  }
  filterChildOrders(parent:string):orders[] {
    let childOrders =  this.fullOrdersSet.filter(el=>el.parent_order===Number(parent));
    return childOrders;
  }
  excludeOrdersWithParent ():orders[] {
    this.fullfilteredOrdersSet = this.dataSource.data;
    return this.dataSource.data.filter(order=>!order.parent_order)
  }
  showClientOrders (show:boolean) {
    this.disabledControlElements=show;
    this.dataSource.data = show? this.fullfilteredOrdersSet.filter(order=>order.ordertype==='Client') : this.fullfilteredOrdersSet.filter(order=>!order.parent_order)
  }
  applyFilter(event: KeyboardEvent, col?:string) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim();
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage();}
  }
  updateFilter (el: string) {
    this.filterALL.nativeElement.value = this.filterALL.nativeElement.value + el+',';
    this.dataSource.filter = this.filterALL.nativeElement.value.slice(0,-1).trim();
    (this.dataSource.paginator)? this.dataSource.paginator.firstPage() : null;
  }
  clearFilter (input:HTMLInputElement) {
    input.value=''
    this.dataSource.filter = ''
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage()}
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
  isAllSelected() { return this.SelectionService.isAllSelected(this.dataSource, this.selection)} 
  toggleAllRows(forceSelectAll:boolean=false) { return this.SelectionService.toggleAllRows(this.dataSource, this.selection,forceSelectAll)} 
  checkboxLabel(row?: orders): string {
    return this.SelectionService.checkboxLabel(this.dataSource, this.selection, row)
  }
  selectOrder (element:orders) {this.modal_principal_parent.emit(element)}
  showOrders($event:Event,element:orders) {
    this.highlight(element)
    this.expandAllowed? this.expandedElement = this.expandedElement === element ? null : element:this.expandAllowed=true;
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
    let numberFields=['id','qty', 'amount','id_order','id_bulk_order','entries','idtrade','price','unexecuted','parent_order','allocated','idcurrency'];
    let dateFields=['generated'];
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
    this.HandlingCommonTasksS.exportToExcel (dataToExport,"ordersData");   
  }
  get  type () {return this.searchParametersFG.get('type') } 
  get  tdate () {return this.searchParametersFG.get('tdate') } 
  get  vdate () {return this.searchParametersFG.get('vdate') } 
  get  secidList () {return this.searchParametersFG.get('secidList') } 
  get  cptyList () {return this.searchParametersFG.get('cptyList') } 
  get  qty () {return this.searchParametersFG.get('qty') } 
  get  price () {return this.searchParametersFG.get('price') } 
}
