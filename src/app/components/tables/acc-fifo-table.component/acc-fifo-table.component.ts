import {Component, ViewChild, Input, ChangeDetectionStrategy, ElementRef} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {Observable, Subscription, } from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {tableHeaders } from 'src/app/models/interfaces.model';
import {formatNumber } from '@angular/common';
import {HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import {HandlingCommonTasksService } from 'src/app/services/handling-common-tasks.service';
import {AuthService } from 'src/app/services/auth.service';
import {AppAccFeesScheduleFormComponent } from '../../forms/acc-fees-schedule-form.component/acc-fees-schedule-form.component';
import { MatDialogRef} from '@angular/material/dialog';
import { FifoTableData } from 'src/app/models/accountng-intefaces.model';
import { AccountingTradesService } from 'src/app/services/accounting-trades.service';
import { AppTradeService } from 'src/app/services/trades-service.service';
import { AbstractControl, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
@Component({
  selector: 'acc-fifo-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './acc-fifo-table.component.html',
  styleUrls: ['./acc-fifo-table.component.scss'],
})
export class AppAccFifoTable {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  private subscriptions = new Subscription()
  @Input() readOnly:boolean = false;
  @Input() idFeeMain:number;
  columnsWithHeaders: tableHeaders[] = [  
    {
      "fieldName": "out_date",
      "displayName": "Date"
    },
    {
      "fieldName": "portfolioname",
      "displayName": "Portfolio"
    },
    {
      "fieldName": "position_type",
      "displayName": "PosType"
    },
    {
      "fieldName": "allocated_trade",
      "displayName": "ClientTrade"
    },
    {
      "fieldName": "idtrade",
      "displayName": "Trade"
    },
    {
      "fieldName": "secid",
      "displayName": "SecID"
    },
    {
      "fieldName": "tr_type",
      "displayName": "Type"
    },
    {
      "fieldName": "rest_qty",
      "displayName": "Rest Qty"
    },
    {
      "fieldName": "qty",
      "displayName": "Qty"
    },
    {
      "fieldName": "qty_out",
      "displayName": "Qty Out"
    },
    {
      "fieldName": "profit_loss",
      "displayName": "PnL"
    },
    {
      "fieldName": "price_in",
      "displayName": "Price In"
    },
    {
      "fieldName": "price_out",
      "displayName": "Price Out"
    },
    {
      "fieldName": "id_sell_trade",
      "displayName": "Close Trade"
    },
    {
      "fieldName": "id_buy_trade",
      "displayName": "Open Trade"
    },
    {
      "fieldName": "trade_date",
      "displayName": "Trade Date"
    },
    {
      "fieldName": "id",
      "displayName": "ID"
    },
  ]
  columnsToDisplay: string [];
  columnsHeaderToDisplay: string [];
  dataSource: MatTableDataSource<FifoTableData>;
  fullDataSource: FifoTableData[];
  @ViewChild('filterALL', { static: false }) filterALL: ElementRef;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  multiFilter?: (data: FifoTableData, filter: string) => boolean;
  refFeeForm : MatDialogRef<AppAccFeesScheduleFormComponent>
  panelOpenState = false;
  filterednstrumentsLists : Observable<string[]>;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  dataRange = new FormGroup ({
    dateRangeStart: new FormControl<Date | null>(null),
    dateRangeEnd: new FormControl<Date | null>(null),
  });
  searchParametersFG: FormGroup;
  constructor(
    private AuthServiceS:AuthService,  
    private HandlingCommonTasksS:HandlingCommonTasksService,
    private CommonDialogsService:HadlingCommonDialogsService,
    private TradeService: AppTradeService,
    private accountingTradeService: AccountingTradesService,
    private fb:FormBuilder, 
  ) {
    this.columnsToDisplay=this.columnsWithHeaders.map(el=>el.fieldName);
    this.columnsHeaderToDisplay=this.columnsWithHeaders.map(el=>el.displayName);
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToTradesData')[0].elementvalue;
    this.searchParametersFG = this.fb.group ({
      type:null,
      secidList: [],
      portfoliosList:  [],
      tradesIDs:  [],
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
   this.tradesIDs.patchValue(['ClearAll'])
   this.portfoliosList.patchValue(['ClearAll'])
   this.secidList.patchValue(['ClearAll'])
    this.disabledControlElements = this.accessState === 'full'&&this.readOnly===false? false : true;
    this.multiFilter = (data: FifoTableData, filter: string) => {
      let filter_array = filter.split(',').map(el=>[el,1]);
      this.columnsToDisplay.forEach(col=>filter_array.forEach(fil=>{
        data[col]&&fil[0].toString().toUpperCase()===(data[col]).toString().toUpperCase()? fil[1]=0:null
      })
        );
      return !filter || filter_array.reduce((acc,val)=>acc+Number(val[1]),0)===0;
    };
    this.submitQuery(false,false)
  }
  updateDataTable (managementFeeData:FifoTableData[]) {
    this.fullDataSource=managementFeeData;
    this.dataSource  = new MatTableDataSource(managementFeeData);
    this.dataSource.filterPredicate =this.multiFilter
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  submitQuery (reset:boolean=false, showSnackResult:boolean=true) {
    let searchObj:{type:number,
      secidList: string[],
      portfoliosList:  string[],
      tradesIDs:  number[],
      tdate : string,
      id_bulk_order:null,
      price:string,
      qty:string}
    searchObj = reset?  {} : this.searchParametersFG.value;
    this.dataSource?.data? this.dataSource.data = null : null;
    searchObj.secidList = [0,1].includes(this.secidList.value.length)&&this.secidList.value[0]==='ClearAll'? null : this.secidList.value.map(el=>el.toUpperCase());
    searchObj.portfoliosList = [0,1].includes(this.portfoliosList.value.length)&&this.portfoliosList.value[0]==='ClearAll'? null : this.portfoliosList.value.map(el=>el.toUpperCase());
    searchObj.tradesIDs = [0,1].includes(this.tradesIDs.value.length)&&this.tradesIDs.value[0]==='ClearAll'? null 
    : this.tradesIDs.value.slice(1).map(el=>el.toUpperCase());
    searchObj.qty = searchObj.qty? this.HandlingCommonTasksS.toNumberRangeNew(this.qty.value,this.qty,'qty'):null;
    searchObj.price = searchObj.price? this.HandlingCommonTasksS.toNumberRangeNew(this.price.value,this.price,'price'):null;
    searchObj.tdate = this.tdate.value? this.HandlingCommonTasksS.toDateRangeNew(this.tdate, 'tdate') : null;
    this.accountingTradeService.getFifoTableData(searchObj).subscribe(data => {
      this.updateDataTable(data)
      showSnackResult? this.CommonDialogsService.snackResultHandler({
        name:data['name'], 
        detail:data['name'] === 'error'? data['detail'] :  formatNumber (data.length,'en-US') + ' rows'}, 'Loaded ') : null;
    });
  }
  showTradeDetails (idtrade:number) {
    this.TradeService.getTradeDetails(idtrade).subscribe(data=>this.CommonDialogsService.jsonDataDialog(data[0],'Trade Details'))
  }
  updateFilter (el: KeyboardEvent) {
    this.filterALL.nativeElement.value = this.filterALL.nativeElement.value + el+',';
    this.dataSource.filter = this.filterALL.nativeElement.value.slice(0,-1).trim().toLowerCase();
    (this.dataSource.paginator)? this.dataSource.paginator.firstPage() : null;
  }
  applyFilter(event: KeyboardEvent) {
    const filterValue = (event.target as HTMLInputElement).value 
    this.dataSource.filter = filterValue.trim().toLowerCase();
    this.dataSource.paginator? this.dataSource.paginator.firstPage():null;
  }
  clearFilter (input:HTMLInputElement) {
    input.value=''
    this.dataSource.filter = ''
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage()}
  }
  exportToExcel() {
    let dataTypes =  {
      out_date:'Date',
      idtrade:'number',
      qty:'number',
      qty_out:'number',
      price_in:'number',
      price_out:'number',
      closed:'boolean',
      idportfolio:'number',
      trade_date:'Date',
      id:'number',
      generated:'Date',
      profit_loss:'number',
      id_sell_trade:'number',
      id_buy_trade:'number',
    }
    let dataToExport =  structuredClone(this.fullDataSource);
    dataToExport.map(el=>{
      Object.keys(el).forEach(key=>{
        switch (true==true) {
          case el[key]&&dataTypes[key]==='number': return el[key]=Number(el[key])
          case el[key]&&dataTypes[key]==='Date': return el[key]=new Date(el[key])
          default: return el[key]=el[key]
        }
      })
      return el;
    });
    this.HandlingCommonTasksS.exportToExcel (dataToExport,"FIFOData");  
  }
  changedValueofChip (value:string, control:AbstractControl)  {control.value.push(value);}
  addNew(event: MatChipInputEvent,control:AbstractControl) {
    control.patchValue (((event.value || '').trim())?  ([...control.value,...event.value.split(',')]) : control.value);
    event.chipInput!.clear();
  }
  removeNew(element: string, control:AbstractControl) {
    const index = control.value.indexOf(element);
    (index >= 0)? control.value.splice(index, 1) : null;
  }
  clearAllNew(event, control:AbstractControl) {
    if (event.target.textContent.trim() === 'ClearAll') {
      control.patchValue(['ClearAll']);
    };
  }
  get  type () {return this.searchParametersFG.get('type') } 
  get  tdate () {return this.searchParametersFG.get('tdate') } 
  get  secidList () {return this.searchParametersFG.get('secidList') } 
  get  portfoliosList () {return this.searchParametersFG.get('portfoliosList') } 
  get  tradesIDs () {return this.searchParametersFG.get('tradesIDs') } 
  get  qty () {return this.searchParametersFG.get('qty') } 
  get  price () {return this.searchParametersFG.get('price') } 
}

