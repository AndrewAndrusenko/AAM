import {AfterViewInit, Component, EventEmitter, Output, ViewChild, Input, ChangeDetectionStrategy, ElementRef} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {Observable, map, startWith } from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { orders } from 'src/app/models/intefaces.model';
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
@Component({
  selector: 'app-orders-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './orders-table.component.html',
  styleUrls: ['./orders-table.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class AppOrderTableComponent  implements AfterViewInit {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  @Input() tableMode:string;
  @Input() dataToShow:orders[];
  @Input() bulkOrder:number;
  fullOrdersSet:orders[];
  columnsToDisplay = ['select','id','ordertype','type','secid','secid_type','security_group_name','qty','price','amount','qty_executed','status','parent_order','portfolioname','idcurrency','generated','action']
  columnsHeaderToDisplay = ['ID','Order','Type','SecID','Class','Group','Quantity','Price','Amount','QtyClosed','Status','ParentID','Portfolio','Currency','Created','Action']
  expandedElement: orders  | null;
  expandAllowed: boolean = true;
  columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
  dataSource: MatTableDataSource<orders>;
  selection = new SelectionModel<orders>(true, []);
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('filterALL', { static: false }) filterALL: ElementRef;
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

  defaultFilterPredicate?: (data: any, filter: string) => boolean;
  secidfilter?: (data: any, filter: string) => boolean;
  constructor(
    private TradeService: AppTradeService,
    private AuthServiceS:AuthService,  
    private HandlingCommonTasksS:HandlingCommonTasksService,
    private SelectionService:HandlingTableSelectionService,
    private CommonDialogsService:HadlingCommonDialogsService,
    private AutoCompService:AtuoCompleteService,
    private dialog: MatDialog,
    private fb:FormBuilder, 
  ) {
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToTradesData')[0].elementvalue;
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
      switch (data.action) {
        case 'Deleted':
          this.dataSource.data.splice(index,1)
        break;
        case 'Created':
          this.dataSource.data.unshift(data.data[0])
        break;
        case 'Updated':
          this.dataSource.data[index] = {...data.data[0]}
        break;
      }
     this.dataSource.paginator = this.paginator;
     this.dataSource.sort = this.sort;
    })
  }
  async ngAfterViewInit() {
    if (this.tableMode!=='Child') {
      this.TradeService.getOrderInformation(null).subscribe (ordersData => {
        this.fullOrdersSet = ordersData;
        this.updateordersDataTable(ordersData)
      });  
      this.AutoCompService.getSecidLists();
      this.filterednstrumentsLists = this.secidList.valueChanges.pipe(
        startWith(''),
        map(value => this.AutoCompService.filterList(value || '','secid'))
      );
    } else { 
      this.dataSource  = new MatTableDataSource(this.dataToShow.filter(el=>el.parent_order===Number(this.bulkOrder)))
    }
  }

  unmergeBulk (id:number[]) {
    this.TradeService.unmergerBulkOrder(id.map(el=>Number(el))).subscribe(data => this.submitQuery())
  }
  createBulkOrders () {
    this.TradeService.createBulkOrder(this.selection.selected.map(el=>el.ordertype==='Client'? Number(el.id):null)).subscribe(data =>this.submitQuery())
  }
  filterChildOrders(parent:string):orders[] {
    let childOrders =  this.fullOrdersSet.filter(el=>el.parent_order===Number(parent));
    return childOrders;
  }
  excludeOrdersWithParent ():orders[] {
    return this.dataSource.data.filter(order=>!order.parent_order)
  }
  updateordersDataTable (ordersData:orders[]) {
    this.dataSource  = new MatTableDataSource(ordersData);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.defaultFilterPredicate = this.dataSource.filterPredicate;
    this.dataSource.filterPredicate = function(data, filter: string): boolean {return data.secid.toLowerCase().includes(filter)};
    this.secidfilter = this.dataSource.filterPredicate;
    this.dataSource.data = this.excludeOrdersWithParent()
  }
  applyFilter(event: any, col?:string) {
    this.dataSource.filterPredicate = col === undefined? this.defaultFilterPredicate : this.secidfilter
    const filterValue = event.hasOwnProperty('isUserInput')?  event.source.value :  (event.target as HTMLInputElement).value 
    !event.hasOwnProperty('isUserInput') || event.isUserInput ? this.dataSource.filter = filterValue.trim().toLowerCase() : null;
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage();}
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
    this.dataSource.filter = el.trim();
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
  async submitQuery (reset:boolean=false) {
    return new Promise((resolve, reject) => {
      let searchObj = reset?  {} : this.searchParametersFG.value;
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
      this.price.value? searchObj = {...searchObj, ... this.HandlingCommonTasksS.toNumberRange(this.price.value,this.price,'price')} :null;
      searchObj = {...searchObj, ...this.tdate.value? this.HandlingCommonTasksS.toDateRange(this.tdate, 'tdate') : null}
      this.TradeService.getOrderInformation(searchObj).subscribe(data => {
        this.fullOrdersSet = data;
        this.dataSource  = new MatTableDataSource(data);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.dataSource.data = this.excludeOrdersWithParent()
        this.CommonDialogsService.snackResultHandler({name:'success',detail: formatNumber (data.length,'en-US') + ' rows'}, 'Loaded ');
        resolve(data) 
      });
    });
  }
  selectOrder (element:orders) {this.modal_principal_parent.emit(element)}
  showOrders($event:Event,element:orders) {
    this.expandAllowed? this.expandedElement = this.expandedElement === element ? null : element:this.expandAllowed=true;
  }
  selectItem (event:any) {
    console.log('event row',event);
  }
  openTradeModifyForm (action:string, element:any) {
    this.dialogOrderModify = this.dialog.open (AppTradeModifyFormComponent,{minHeight:'600px', minWidth:'40vw', autoFocus: false, maxHeight: '90vh'})
    this.dialogOrderModify.componentInstance.action = action;
    this.dialogOrderModify.componentInstance.data = action ==='Create'? null :element;
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
