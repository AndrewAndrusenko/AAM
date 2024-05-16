import {Component,ViewChild, Input} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {catchError, EMPTY, map, Observable, startWith, Subscription } from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {marketData, marketDataSources, tableHeaders } from 'src/app/models/interfaces.model';
import {AppAccountingService } from 'src/app/services/accounting.service';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {MatChipInputEvent} from '@angular/material/chips';
import {FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {MatSnackBar } from '@angular/material/snack-bar';
import {AppMarketDataService, logLoadingState, marketDateLoaded } from 'src/app/services/market-data.service';
import {AtuoCompleteService } from 'src/app/services/auto-complete.service';
import {DatePipe, formatNumber } from '@angular/common';
import {HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import {HandlingCommonTasksService } from 'src/app/services/handling-common-tasks.service';
import {AuthService } from 'src/app/services/auth.service';
import {moexBoard } from 'src/app/models/instruments.interfaces';
import {indexDBService } from 'src/app/services/indexDB.service';
import {MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AppMarketQuoteManualFormComponent } from '../../forms/market-quote-manual-form.component/market-quote-manual-form.component';
@Component({
  selector: 'app-table-market-data',
  templateUrl: './market-data-table.component.html',
  styleUrls: ['./market-data-table.component.scss'],
})
export class AppTableMarketDataComponent {
  datePipe: DatePipe;
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  columnsWithHeaders: tableHeaders[] = [
    {
      "fieldName": "globalsource",
      "displayName": "Source"
    },
    {
      "fieldName": "sourcecode",
      "displayName": "code"
    },
    {
      "fieldName": "boardid",
      "displayName": "boardid"
    },
    {
      "fieldName": "tradedate",
      "displayName": "tradedate"
    },
    {
      "fieldName": "secid",
      "displayName": "secid"
    },
    {
      "fieldName": "open",
      "displayName": "open"
    },
    {
      "fieldName": "low",
      "displayName": "low"
    },
    {
      "fieldName": "high",
      "displayName": "high"
    },
    {
      "fieldName": "close",
      "displayName": "close"
    },
    {
      "fieldName": "value",
      "displayName": "value"
    },
    {
      "fieldName": "volume",
      "displayName": "volume"
    },
    {
      "fieldName": "marketprice2",
      "displayName": "market P2"
    },
    {
      "fieldName": "admittedquote",
      "displayName": "admitted P"
    },
    {
      "fieldName": "numtrades",
      "displayName": "Qty Tr"
    }
  ]
  columnsToDisplay:string[]=[];
  columnsHeaderToDisplay:string[]=[];
  dataSource: MatTableDataSource<marketData>;
  @Input() FormMode:string = 'Full'
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  loadMarketData: FormGroup;
  loadingDataLog:{dataLoaded: marketDateLoaded[],deletedRows:number, state:logLoadingState}={
    dataLoaded:[], deletedRows:0,state: {Message:'',State:''}
  }
  panelOpenStateFirst = true; 
  panelOpenStateSecond = true;
  statusLogPanelOpenState = true;
  instruments: string[] = ['ClearAll'];
  filterednstrumentsLists : Observable<string[][]>;
  manualQuoteForm : MatDialogRef<AppMarketQuoteManualFormComponent>
  FirstOpenedAccountingDate : Date;
  searchParametersFG: FormGroup;
  boardIDs:moexBoard[] = [];
  marketSources:marketDataSources[] =  [];
  fullSourcesSet:{code:string,name:string}[]=[];  
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  filterlFormControl = new FormControl<string|null>('');
  dataRange = new FormGroup ({
    dateRangeStart: new FormControl<Date | null>(null),
    dateRangeEnd: new FormControl<Date | null>(null),
  });
  private subscriptions = new Subscription () 
  constructor(
    private AccountingDataService:AppAccountingService, 
    private MarketDataService: AppMarketDataService,
    private AuthServiceS:AuthService,  
    private AutoCompService:AtuoCompleteService,
    private HandlingCommonTasks:HandlingCommonTasksService,
    private indexDBService:indexDBService,
    private CommonDialogsService:HadlingCommonDialogsService,
    private dialog:MatDialog,
    private fb:FormBuilder, 
    public snack:MatSnackBar,
  ) {
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToInstrumentData')[0].elementvalue;
    this.disabledControlElements = this.accessState === 'full'? false : true;
    this.searchParametersFG = this.fb.group ({
      dataRange : this.dataRange,
      secidList: null,
      amount:{value:null, disabled:true},
      marketSource : {value:null, disabled:false},
      boards : {value:null, disabled:false}
    });
    this.loadMarketData = this.fb.group ({
      dateForLoadingPrices : [new Date().toISOString(), Validators.required],
      sourceCode: [[],Validators.required],
      overwritingCurrentData : [false]
    });
    this.AccountingDataService.GetbParamsgfirstOpenedDate('GetbParamsgfirstOpenedDate').subscribe(data=>this.FirstOpenedAccountingDate = data[0].FirstOpenedDate);
    this.AutoCompService.getSecidLists();
    this.secidList.setValidators(this.AutoCompService.secidValirator())
    this.filterednstrumentsLists = this.secidList.valueChanges.pipe(
      startWith(''),
      map(value => this.AutoCompService.filterList(value || '','secid') as string[][])
    );
    this.datePipe = new DatePipe ('en-US')
    this.subscriptions.add(this.MarketDataService.getReloadMarketData().subscribe(marketData => this.updateMarketDataTable(marketData)));
    this.columnsToDisplay=this.columnsWithHeaders.map(el=>el.fieldName);
    this.columnsHeaderToDisplay=this.columnsWithHeaders.map(el=>el.displayName);
    this.indexDBService.pipeMarketSourceSet.next(true);
    this.indexDBService.pipeBoardsMoexSet.next(true);
    this.subscriptions.add(this.indexDBService.receiveBoardsMoexSet().subscribe(boardsData => this.boardIDs = boardsData));
    this.subscriptions.add(this.indexDBService.receivMarketSourceSett().subscribe(msData => {
      msData.forEach(el=>el.segments.forEach(seg=>this.fullSourcesSet.push({code:seg.sourceCode,name:seg.description})))
      this.marketSources = msData.filter(el=>el.type==='stock')}
      ));

    this.loadingDataLog.state = {Message:'',State: 'None'};
  }
  ngOnDestroy(): void {this.subscriptions.unsubscribe()}
  manualQuote (action1:string,data:marketData|null){
    this.manualQuoteForm=this.dialog.open(AppMarketQuoteManualFormComponent,{ maxWidth:'60vw', autoFocus: false, maxHeight: '90vh'});
    this.manualQuoteForm.componentInstance.action=action1;
    this.manualQuoteForm.componentInstance.moexBoards=this.boardIDs;
    this.manualQuoteForm.componentInstance.marketSergements=this.fullSourcesSet;
    this.manualQuoteForm.componentInstance.data=data;
    
  }
  updateAllComplete(index:number) {
    this.marketSources[index].checkedAll = this.marketSources[index].segments != null && this.marketSources[index].segments.every(t => t.checked); 
    this.marketSources[index].indeterminate = this.marketSources[index].segments.filter(t => t.checked).length > 0 && !this.marketSources[index].checkedAll; 
    this.disableAllexceptOne(index);
    this.showSelectedSources();
  }
  disableAllexceptOne(index:number) {
    let disableOtherSources = this.marketSources[index].checkedAll||this.marketSources[index].indeterminate? true:false;
    this.marketSources.forEach((el, i)=>{i===index? null : el.disabled = disableOtherSources})
  }
  showSelectedSources() {
    let sourceIdToLoad =[]
    this.marketSources.forEach(source => source.segments.forEach(segment => segment.checked? sourceIdToLoad.push(segment):null))
    this.sourceCode.setValue(sourceIdToLoad)
  }
  setAll(index: number) {
    this.marketSources[index].indeterminate=false;
    this.marketSources[index].segments.forEach(t => (t.checked = this.marketSources[index].checkedAll)); 
    this.disableAllexceptOne(index);
    this.showSelectedSources();
  }
  getMarketData () {
    this.loadingDataLog.state = {Message : 'Loading', State: 'Pending'}
    let dateToLoad = this.datePipe.transform(this.dateForLoadingPrices.value,'YYYY-MM-dd')
    this.loadMarketData.disable();
    this.MarketDataService.uploadMarketData(dateToLoad, this.sourceCode.value,this.overwritingCurrentData.value).pipe(
      catchError(err=>{
        console.log('comp err',err);
        this.loadMarketData.enable();
        this.loadingDataLog.state = {Message: 'Loading has been aborted due to error.', State: 'terminated'}
        this.loadingDataLog.dataLoaded = [];
        return EMPTY
      })
    ).subscribe(data=>{
      this.loadingDataLog=data;
      data.dataLoaded.length>0? this.loadingDataLog.state = {Message:'Loading is complited.', State:'Success'} : null;
      this.marketSources.forEach(el=>{
        el.checkedAll=false;
        el.segments.forEach(el=>el.checked=false)
      });
      this.loadMarketData.enable();
    })
  }
  updateMarketDataTable (marketData:marketData[]) {
    this.dataSource  = new MatTableDataSource(marketData);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage();}
  }
  changedValueofChip (value:string) {
    this.instruments[this.instruments.length-1] === 'ClearAll'? this.instruments.push(value) : this.instruments[this.instruments.length-1] = value}
  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    const valueArray = event.value.split(',');
    (value)? this.instruments = [...this.instruments,...valueArray] : null;
    event.chipInput!.clear();
  }
  remove(account: string): void {
    const index = this.instruments.indexOf(account);
   (index >= 0)? this.instruments.splice(index, 1) : null
  }
  clearAll(event) {
    event.target.textContent.trim() === 'ClearAll'? this.instruments = ['ClearAll']: null;
  }
  addChips (el: string, column: string) {(['accountNo'].includes(column))? this.instruments.push(el):null;}
  updateFilter (el: string) {
    this.filterlFormControl.patchValue(el);
    this.dataSource.filter = el.trim();
    (this.dataSource.paginator)? this.dataSource.paginator.firstPage() : null;
  }
  clearFilter (input:HTMLInputElement) {
    input.value = '';
    this.dataSource.filter = '';
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage()}
  }
  submitQuery () {
    this.dataSource? this.dataSource.data=null : null;
    let searchObj = {};
    let instrumentsList = [];
    this.instruments.indexOf('ClearAll') !== -1? this.instruments.splice(this.instruments.indexOf('ClearAll'),1) : null;
    this.instruments.length===1? instrumentsList = [...this.instruments,...this.instruments]: instrumentsList = this.instruments;
    this.instruments.length? Object.assign (searchObj , {'secid': instrumentsList}): null;
    this.gRange.get('dateRangeStart').value===null? null : Object.assign (searchObj , {
      'dateRangeStart':new Date (this.gRange.get('dateRangeStart').value).toDateString()});
    this.gRange.get('dateRangeEnd').value===null? null : Object.assign (searchObj , {
      'dateRangeEnd': new Date (this.gRange.get('dateRangeEnd').value).toDateString()});
    this.marketSource.value != null&&this.marketSource.value.length !=0? Object.assign (searchObj , {'sourcecode': this.marketSource.value}): null;
    this.boards.value != null&&this.boards.value.length !=0? Object.assign (searchObj , {'boardid': this.boards.value}): null;
    this.MarketDataService.getMarketData(undefined,this.FormMode==='ChartMode'? 'tradedate ASC':'tradedate DESC',searchObj).subscribe (marketData  => {
      this.dataSource  = new MatTableDataSource(marketData);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.instruments.unshift('ClearAll')
      this.FormMode==='ChartMode'? this.MarketDataService.sendMarketDataForChart(marketData) : null;
      this.CommonDialogsService.snackResultHandler({name:'success',detail: formatNumber (marketData.length,'en-US') + ' rows'},'Loaded ');
    })
  }
  toggleAllSelection(elem:string, allSelected: boolean) {
    allSelected? this.searchParametersFG.get(elem).patchValue(
      elem==='marketSource'? [...this.marketSources.map(item => item.segments.map(el => el.sourceCode)),0].flat() : [...this.boardIDs.map(item => item.boardid
    ), 0]) : this.searchParametersFG.get(elem).patchValue([]);
  }   
  exportToExcel() {
    let numberFields:string[] = [
      "open",
      "low",
      "high",
      "close",
      "value",
      "volume",
      "marketprice2",
      "admittedquote",
      "numtrades"
    ]
    let dateFields:string[]=['tradedate']
    this.HandlingCommonTasks.exportToExcel (this.dataSource.data,"marketData",numberFields,dateFields);  

  }
  getMoexSecurities (){
    this.MarketDataService.getMoexInstrumentsList().subscribe(data=>console.log('inserted - ',data))
  }
  msQuoteToMT (){
    let dateToLoad = this.datePipe.transform(this.dateForLoadingPrices.value,'YYYY-MM-dd')
    this.MarketDataService.moveMarketStackToMainTable(dateToLoad).subscribe(data=> {
      this.CommonDialogsService.snackResultHandler({name:'success',detail: data[0].o_rows_moved + ' rows'},'Copied ')
    })  
  }
  get gRange () {return this.searchParametersFG.get('dataRange') } 
  get dateRangeStart() {return this.searchParametersFG.get('dateRangeStart') } 
  get dateRangeEnd() {return this.searchParametersFG.get('dateRangeEnd') } 
  get marketSource () {return this.searchParametersFG.get('marketSource') } 
  get boards () {return this.searchParametersFG.get('boards') } 
  get secidList () {return this.searchParametersFG.get('secidList') } 
  get dateForLoadingPrices() {return this.loadMarketData.get('dateForLoadingPrices')}
  get sourceCode() {return this.loadMarketData.get('sourceCode')}
  get overwritingCurrentData() {return this.loadMarketData.get('overwritingCurrentData')}
  
}