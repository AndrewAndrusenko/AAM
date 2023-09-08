import {AfterViewInit, Component, EventEmitter, Output, ViewChild, Input, ChangeDetectionStrategy, ElementRef, TemplateRef} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {Observable, Subscription, map, startWith, switchMap, tap } from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { Instruments, trades } from 'src/app/models/intefaces.model';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {MatChipInputEvent} from '@angular/material/chips';
import { AbstractControl, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { formatNumber } from '@angular/common';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { HandlingCommonTasksService } from 'src/app/services/handling-common-tasks.service';
import { AuthService } from 'src/app/services/auth.service';
import { AppTradeService } from 'src/app/services/trades-service.service';
import { AppTradeModifyFormComponent } from '../../forms/trade-form.component/trade-form.component';
import { AtuoCompleteService } from 'src/app/services/auto-complete.service';

@Component({
  selector: 'app-trade-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './trade-table.component.html',
  styleUrls: ['./trade-table.component.scss'],
})
export class AppTradeTableComponent  implements AfterViewInit {
  private arraySubscrition = new Subscription ()
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  @Input() FormMode:string
  columnsToDisplay = ['idtrade','tdate','trtype','tidinstrument','price','id_price_currency','qty','cpty','vdate','id_settlement_currency','tidorder','allocatedqty','action'];
  columnsHeaderToDisplay = ['ID','Date','Type','SecID','Price','Currency','Quantity','CParty','ValueDate','Settlement','Order','Allocated','Action'
  ];
  dataSource: MatTableDataSource<trades>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('filterALL', { static: false }) filterALL: ElementRef;

  @Output() public modal_principal_parent = new EventEmitter();
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  panelOpenStateSecond = false;
  accessToClientData: string = 'true';
  instruments: string[] = ['ClearAll'];
  counterparties: string[] = ['ClearAll'];
  filterednstrumentsLists : Observable<string[]>;
  filteredCptyLists : Observable<string[]>;
  searchParametersFG: FormGroup;
  dataRange = new FormGroup ({
    dateRangeStart: new FormControl<Date | null>(null),
    dateRangeEnd: new FormControl<Date | null>(null),
  });
  dataRangeVdate = new FormGroup ({
    dateRangeStart: new FormControl<Date | null>(null),
    dateRangeEnd: new FormControl<Date | null>(null),
  });
  public dialogTradeModify: MatDialogRef<AppTradeModifyFormComponent>
  
  defaultFilterPredicate?: (data: any, filter: string) => boolean;
  secidfilter?: (data: any, filter: string) => boolean;
  @ViewChild(TemplateRef) _dialogTemplate: TemplateRef<any>;
  constructor(
    private TradeService: AppTradeService,
    private AuthServiceS:AuthService,  
    private HandlingCommonTasksS:HandlingCommonTasksService,
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
      vdate : this.dataRangeVdate,
      price:null,
      qty:null,
    });
    this.arraySubscrition.add(this.TradeService.getReloadOrdersForExecution().subscribe(data=>{
      let i = this.dataSource.data.findIndex(el=>el.idtrade===data.idtrade);
      i!==-1? this.dataSource.data[i].allocatedqty =Number(data.data.filter(alloc=>alloc['id_joined']==this.dataSource.data[i].idtrade)[0].allocated)+Number(this.dataSource.data[i].allocatedqty) : null;
      this.dataSource.paginator = this.paginator;
    }))
    this.arraySubscrition.add(this.TradeService.getNewAllocatedQty().subscribe(data=>{
      this.dataSource.data[this.dataSource.data.findIndex(el=>(el.idtrade)===data.idtrade)].allocatedqty=data.allocatedqty;  
      this.dataSource.paginator=this.paginator;
    }));
    this.arraySubscrition.add(this.TradeService.getTradeDataToUpdateTableSource().subscribe(data =>{
      let index =  this.dataSource.data.findIndex(elem=>elem.idtrade===data.data[0].idtrade)
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
    }));
  }
  ngOnDestroy(): void {
    this.arraySubscrition.unsubscribe();
  }
  confirmAllocation (idtrade:number) {

  }

   async ngAfterViewInit() {
    this.TradeService.getTradeInformation(null).subscribe (tradesData => this.updateTradesDataTable(tradesData));  
    this.AutoCompService.getSecidLists();
    this.AutoCompService.getCounterpartyLists();
    this.filterednstrumentsLists = this.secidList.valueChanges.pipe(
      startWith(''),
      map(value => this.AutoCompService.filterList(value || '','secid'))
    );
    this.filteredCptyLists = this.cptyList.valueChanges.pipe(
      startWith(''),
      map(value => this.AutoCompService.filterList(value || '','cpty'))
    );
  }  
  openTradeModifyForm (action:string, element:any,tabIndex:number=0) {
    this.dialogTradeModify = this.dialog.open (AppTradeModifyFormComponent,{minHeight:'600px', minWidth:'60vw', maxWidth:'80vw', maxHeight: '90vh'})
    this.dialogTradeModify.componentInstance.action = action;
    this.dialogTradeModify.componentInstance.tabIndex=tabIndex;
    this.dialogTradeModify.componentInstance.data = action ==='Create'? null :element;
  }
  updateTradesDataTable (tradesData:trades[]) {
    this.dataSource  = new MatTableDataSource(tradesData);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.defaultFilterPredicate = this.dataSource.filterPredicate;
    this.dataSource.filterPredicate = function(data, filter: string): boolean {return data.tidinstrument.toLowerCase().includes(filter)};
    this.secidfilter = this.dataSource.filterPredicate;
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
  async submitQuery (reset:boolean=false) {
    return new Promise((resolve, reject) => {
      let searchObj = reset?  {} : this.searchParametersFG.value;
      this.dataSource.data? this.dataSource.data = null : null;
      searchObj.cptyList = [0,1].includes(this.counterparties.length)&&this.counterparties[0]==='ClearAll'? null : this.counterparties.map(el=>el.toLocaleLowerCase())
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
      searchObj = {...searchObj, ...this.vdate.value? this.HandlingCommonTasksS.toDateRange(this.vdate,'vdate') : null}
      this.arraySubscrition.add(this.TradeService.getTradeInformation(searchObj).subscribe(data => {
        this.dataSource  = new MatTableDataSource(data);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.CommonDialogsService.snackResultHandler({name:'success',detail: formatNumber (data.length,'en-US') + ' rows'}, 'Loaded ');
        resolve(data) 
      }));
    });
  }
  selectInstrument (element:Instruments) {this.modal_principal_parent.emit(element)}
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
  }),"tradesData")  }
  get  type () {return this.searchParametersFG.get('type') } 
  get  tdate () {return this.searchParametersFG.get('tdate') } 
  get  vdate () {return this.searchParametersFG.get('vdate') } 
  get  secidList () {return this.searchParametersFG.get('secidList') } 
  get  cptyList () {return this.searchParametersFG.get('cptyList') } 
  get  qty () {return this.searchParametersFG.get('qty') } 
  get  price () {return this.searchParametersFG.get('price') } 
}
