import { Component, EventEmitter, Output, ViewChild, Input, ChangeDetectionStrategy, ElementRef} from '@angular/core';
import { MatPaginator as MatPaginator} from '@angular/material/paginator';
import { MatSort} from '@angular/material/sort';
import { Observable, Subscription, map, startWith } from 'rxjs';
import { MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { counterParty, trades } from 'Frontend-Angular-Src/app/models/interfaces.model';
import { COMMA, ENTER} from '@angular/cdk/keycodes';
import { MatChipInputEvent} from '@angular/material/chips';
import { AbstractControl, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { formatNumber } from '@angular/common';
import { HadlingCommonDialogsService } from 'Frontend-Angular-Src/app/services/hadling-common-dialogs.service';
import { HandlingCommonTasksService } from 'Frontend-Angular-Src/app/services/handling-common-tasks.service';
import { AuthService } from 'Frontend-Angular-Src/app/services/auth.service';
import { AppTradeService } from 'Frontend-Angular-Src/app/services/trades-service.service';
import { AppTradeModifyFormComponent } from '../../forms/trade-form.component/trade-form.component';
import { AtuoCompleteService } from 'Frontend-Angular-Src/app/services/auto-complete.service';
import { AppAccountingService } from 'Frontend-Angular-Src/app/services/accounting.service';
import { TreeMenuSevice } from 'Frontend-Angular-Src/app/services/tree-menu.service';
import { Instruments } from 'Frontend-Angular-Src/app/models/instruments.interfaces';
@Component({
  selector: 'app-trade-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './trade-table.component.html',
  styleUrls: ['./trade-table.component.scss'],
})
export class AppTradeTableComponent  {
  private arraySubscrition = new Subscription ();
  FirstOpenedAccountingDate: Date;
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  @Input() FormMode:string
  @Input() secidInput:string
  columnsToDisplay = ['idtrade','tdate','trtype','tidinstrument','price','id_price_currency','qty','cpty','vdate','id_settlement_currency','tidorder','allocatedqty','fifo_qty','action'];
  columnsHeaderToDisplay = ['ID','Date','Type','SecID','Price','Currency','Quantity','CParty','ValueDate','Settlement','Order','Allocated','FIFO','Action'
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
  filterednstrumentsLists : Observable<string[][]>;
  filteredCptyLists : Observable<counterParty[]>;
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
  multiFilter?: (data: trades, filter: string) => boolean;
  activeTab:string=''
/*   
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) { 
    if (this.activeTab==='Trades'){
      event.altKey&&event.key==='r'? this.submitQuery(false):null;
      event.altKey&&event.key==='w'? this.exportToExcel():null;
    }
  } */
  constructor(
    private TreeMenuSeviceS: TreeMenuSevice,
    private TradeService: AppTradeService,
    private AccountingDataService:AppAccountingService, 
    private AuthServiceS:AuthService,  
    private HandlingCommonTasksS:HandlingCommonTasksService,
    private CommonDialogsService:HadlingCommonDialogsService,
    private AutoCompService:AtuoCompleteService,
    private dialog: MatDialog,
    private fb:FormBuilder, 
    ) { }
  ngOnInit(): void {
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToTradesData')[0].elementvalue;
    this.disabledControlElements = this.accessState === 'full'? false : true;
    this.AccountingDataService.GetbParamsgfirstOpenedDate('GetbParamsgfirstOpenedDate').subscribe(data => this.FirstOpenedAccountingDate = data[0].FirstOpenedDate);
    this.searchParametersFG = this.fb.group ({
      type:null,
      secidList: [],
      cptyList:  [],
      tdate : this.dataRange,
      vdate : this.dataRangeVdate,
      price:null,
      qty:null,
    });
    this.TradeService.getTradeInformation(null).subscribe (tradesData => {
      this.updateTradesDataTable(tradesData)
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
    this.multiFilter = (data: trades, filter: string) => {
      let filter_array = filter.split(';').map(el=>[el,1]);
      let colForFilter=this.columnsToDisplay.slice(0,-1)
      colForFilter.forEach(col=>filter_array.forEach(fil=>{
        data[col]!==null && fil[0].toString().toUpperCase()===(data[col]).toString().toUpperCase()? fil[1]=0:null
      }));
      return !filter || filter_array.reduce((acc,val)=>acc+Number(val[1]),0)===0;
    };
    this.arraySubscrition.add(this.TreeMenuSeviceS.getActiveTab().subscribe(tabName=>this.activeTab=tabName));

    this.AutoCompService.subSecIdList.next(true);
    this.AutoCompService.getCounterpartyLists().subscribe();
    this.filterednstrumentsLists = this.secidList.valueChanges.pipe(
      startWith(''),
      map(value => this.AutoCompService.filterList(value || '','secid') as string[][])
    );
    this.filteredCptyLists = this.cptyList.valueChanges.pipe(
      startWith(''),
      map(value => this.AutoCompService.filterList(value || '','cpty') as counterParty[])
  );
  }
  ngOnChanges(): void {
    this.instruments = (['ClearAll',this.secidInput])
    this.submitQuery(false,false)
  }
  ngOnDestroy(): void {
    this.arraySubscrition.unsubscribe();
  }
  submitQuery (reset:boolean=false,showSnackResult:boolean=true) {
    this.AccountingDataService.GetbParamsgfirstOpenedDate('GetbParamsgfirstOpenedDate').subscribe(data => this.FirstOpenedAccountingDate = data[0].FirstOpenedDate);
    let searchObj = reset?  {} : this.searchParametersFG.value;
    this.dataSource?.data? this.dataSource.data = null : null;
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
      this.dataSource.filterPredicate=this.multiFilter;
      showSnackResult? this.CommonDialogsService.snackResultHandler({name:'success',detail: formatNumber (data.length,'en-US') + ' rows'}, 'Loaded '):null;
    }));
  }
  openTradeModifyForm (action:string, element:trades|{},tabIndex:number=0) {
    let dataToForm = structuredClone(element);
    if (action==='Create_Example') {
      (dataToForm as trades).allocatedqty=0;
      (dataToForm as trades).tdate=new Date();
      (dataToForm as trades).vdate=new Date();
    }
    this.dialogTradeModify = this.dialog.open (AppTradeModifyFormComponent,{minHeight:'600px', minWidth:'70vw', maxWidth:'80vw', maxHeight: '90vh'})
    this.dialogTradeModify.componentInstance.action = action;
    this.dialogTradeModify.componentInstance.tabIndex=tabIndex;
    this.dialogTradeModify.componentInstance.data = action ==='Create'? null :dataToForm;
  }
  updateTradesDataTable (tradesData:trades[]) {
    this.dataSource  = new MatTableDataSource(tradesData);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate=this.multiFilter;
  }
  applyFilter(event: KeyboardEvent) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim() ;
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage();}
  }
  updateFilter (el: string) {
    this.filterALL.nativeElement.value = this.filterALL.nativeElement.value + el+';';
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
  selectInstrument (element:Instruments) {this.modal_principal_parent.emit(element)}
  exportToExcel() {
  let numberFields=['idtrade','price','id_price_currency','qty','id_settlement_currency','tidorder','allocatedqty','fifo_qty'];
  let dateFields=['tdate','vdate'];
  this.HandlingCommonTasksS.exportToExcel (this.dataSource.data,"tradesData",numberFields,dateFields);  

  }
  get  type () {return this.searchParametersFG.get('type') } 
  get  tdate () {return this.searchParametersFG.get('tdate') } 
  get  vdate () {return this.searchParametersFG.get('vdate') } 
  get  secidList () {return this.searchParametersFG.get('secidList') } 
  get  cptyList () {return this.searchParametersFG.get('cptyList') } 
  get  qty () {return this.searchParametersFG.get('qty') } 
  get  price () {return this.searchParametersFG.get('price') } 
}
