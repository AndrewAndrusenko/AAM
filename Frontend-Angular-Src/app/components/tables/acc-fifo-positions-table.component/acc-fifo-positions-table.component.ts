import {Component, ViewChild, Input, ChangeDetectionStrategy, ElementRef} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {Observable, Subscription, distinctUntilChanged, map, startWith, tap, } from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {tableHeaders } from 'Frontend-Angular-Src/app/models/interfaces.model';
import {formatNumber } from '@angular/common';
import {HadlingCommonDialogsService } from 'Frontend-Angular-Src/app/services/hadling-common-dialogs.service';
import {HandlingCommonTasksService } from 'Frontend-Angular-Src/app/services/handling-common-tasks.service';
import {AuthService } from 'Frontend-Angular-Src/app/services/auth.service';
import {AppAccFeesScheduleFormComponent } from '../../forms/acc-fees-schedule-form.component/acc-fees-schedule-form.component';
import {MatDialogRef} from '@angular/material/dialog';
import {AccountingTradesService } from 'Frontend-Angular-Src/app/services/accounting-trades.service';
import {MatChipInputEvent } from '@angular/material/chips';
import {AppTradeService } from 'Frontend-Angular-Src/app/services/trades-service.service';
import {AbstractControl, FormBuilder, FormGroup } from '@angular/forms';
import {COMMA, ENTER } from '@angular/cdk/keycodes';
import {FifoPositions } from 'Frontend-Angular-Src/app/models/accountng-intefaces.model';
import { AtuoCompleteService } from 'Frontend-Angular-Src/app/services/auto-complete.service';
@Component({
  selector: 'acc-fifo-positions-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './acc-fifo-positions-table.component.html',
  styleUrls: ['./acc-fifo-positions-table.component.scss'],
})
export class AppAccFifoPositionsTable {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  private subscriptions = new Subscription()
  @Input() readOnly:boolean = false;
  @Input() idFeeMain:number;
  columnsWithHeaders: tableHeaders[] = [  
      {
        "fieldName": "trade_date",
        "displayName": "Drade Date"
      },
      {
        "fieldName": "idtrade",
        "displayName": "Client Trade"
      },
      {
        "fieldName": "ext_trade",
        "displayName": "Trade"
      },
       {
        "fieldName": "portfolioname",
        "displayName": "Code"
      },
      {
        "fieldName": "secid",
        "displayName": "SecID"
      },
      {
        "fieldName": "fifo_rest",
        "displayName": "Position qty"
      },
      {
        "fieldName": "fifo_cost",
        "displayName": "Cost $"
      },
      {
        "fieldName": "price_in",
        "displayName": "Price $"
      },
      {
        "fieldName": "qty",
        "displayName": "Quantity"
      },
      {
        "fieldName": "qty_out",
        "displayName": "Qty closed"
      }
  ]
  columnsToDisplay: string [];
  columnsHeaderToDisplay: string [];
  dataSource: MatTableDataSource<FifoPositions>;
  fullDataSource: FifoPositions[];
  @ViewChild('filterALL', { static: false }) filterALL: ElementRef;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  multiFilter?: (data: FifoPositions, filter: string) => boolean;
  refFeeForm : MatDialogRef<AppAccFeesScheduleFormComponent>
  panelOpenState = false;
  filterednstrumentsLists : Observable<string[][]>;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  searchParametersFG: FormGroup;
  constructor(
    private AuthServiceS:AuthService,  
    private AutoCompleteService:AtuoCompleteService,  
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
      secidList: [],
      portfoliosList:  [],
      secidIn:  null,
      tdate : new Date(),
    });
    this.AutoCompleteService.subSecIdList.next(true);
  }
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  ngOnInit(): void {
   this.portfoliosList.patchValue(['ClearAll'])
   this.secidList.patchValue(['ClearAll'])
   this.filterednstrumentsLists = this.secidIn.valueChanges.pipe(
     startWith(''),
     distinctUntilChanged(),
     map((value)=>this.AutoCompleteService.filterList(value||'','secid') as string[][]),
   )
    this.disabledControlElements = this.accessState === 'full'&&this.readOnly===false? false : true;
    this.multiFilter = (data: FifoPositions, filter: string) => {
      let filter_array = filter.split(',').map(el=>[el,1]);
      this.columnsToDisplay.forEach(col=>filter_array.forEach(fil=>{
        data[col]&&fil[0].toString().toUpperCase()===(data[col]).toString().toUpperCase()? fil[1]=0:null
      })
    );
      return !filter || filter_array.reduce((acc,val)=>acc+Number(val[1]),0)===0;
    };
    this.submitQuery(false,false)
  }
  updateDataTable (fifoPositionsData:FifoPositions[]) {
    this.fullDataSource=fifoPositionsData;
    this.dataSource  = new MatTableDataSource(fifoPositionsData);
    this.dataSource.filterPredicate =this.multiFilter
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  submitQuery (reset:boolean=false, showSnackResult:boolean=true) {
    let searchObj:{
      secidList: string[],
      portfoliosList: string [],
      tdate : string
    }
    searchObj = reset?  {} : this.searchParametersFG.value;
    this.dataSource?.data? this.dataSource.data = null : null;
    searchObj.secidList = [0,1].includes(this.secidList.value.length)&&this.secidList.value[0]==='ClearAll'? null : this.secidList.value.map(el=>el.toUpperCase());
    searchObj.portfoliosList = [0,1].includes(this.portfoliosList.value.length)&&this.portfoliosList.value[0]==='ClearAll'? null : this.portfoliosList.value.map(el=>el.toUpperCase());
    searchObj.tdate = this.tdate.value? new Date (this.tdate.value).toDateString(): null;
    this.accountingTradeService.getFifoPositions(searchObj).subscribe(data => {
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
      trade_date: 'Date',
      idtrade :'number',
      idportfolio :'number' ,
      fifo_rest :'number',
      fifo_cost :'number',
      qty :'number',
      qty_out :'number'
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
    this.HandlingCommonTasksS.exportToExcel (dataToExport,"FIFOPositions");  
  }
  changedValueofChip (value:string, control:AbstractControl)  {
    control.value.length>1? control.value.pop():null;
    control.value.push(value);
  }
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
  get  secidIn () {return this.searchParametersFG.get('secidIn') } 
  get  portfoliosList () {return this.searchParametersFG.get('portfoliosList') } 
}

