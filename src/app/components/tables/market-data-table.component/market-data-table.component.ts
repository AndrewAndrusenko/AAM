import {Component, EventEmitter, Output, ViewChild, Input, AfterViewInit} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {map, Observable, startWith } from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import { marketData, marketDataSources, marketSourceSegements } from 'src/app/models/intefaces.model';
import { AppAccountingService } from 'src/app/services/accounting.service';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {MatChipInputEvent} from '@angular/material/chips';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatOption } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppMarketDataService } from 'src/app/services/market-data.service';
import * as moment from 'moment';
import { AtuoCompleteService } from 'src/app/services/auto-complete.service';
import { formatNumber, registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { HandlingCommonTasksService } from 'src/app/services/handling-common-tasks.service';
import { AuthService } from 'src/app/services/auth.service';
import { InstrumentDataService } from 'src/app/services/instrument-data.service';
registerLocaleData(localeFr, 'fr');
/* 
export class extends  */
@Component({
  selector: 'app-table-market-data',
  templateUrl: './market-data-table.component.html',
  styleUrls: ['./market-data-table.component.scss'],
})
export class AppTableMarketDataComponent  implements AfterViewInit {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  @Input() FormMode:string = 'Full'
  loadMarketData: FormGroup;
  marketSources:marketDataSources[] =  [];
  loadedMarketData: any []= []; 
  marketDataToLoad: any;
  columnsToDisplay = ['globalsource','sourcecode','boardid','tradedate','secid', 'open', 'low', 'high', 'close','value','volume','marketprice2',  'admittedquote', 'numtrades' ];
  columnsHeaderToDisplay = ['Source','code','boardid','tradedate','secid', 'open', 'low', 'high', 'close', 'value','volume','market P2', 'admitted P', 'Qty Tr' ];
  dataSource: MatTableDataSource<marketData>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @Output() public modal_principal_parent = new EventEmitter();
  logLoadingData=[];
  statusLogPanelOpenState:boolean=false;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  
  @ViewChild('allSelected') private allSelected: MatOption;
  readOnly: boolean = false; 
  panelOpenStateFirst = false;
  panelOpenStateSecond = true;
  instruments: string[] = ['ClearAll'];
  psearchParameters: any;
  
  filterednstrumentsLists : Observable<string[]>;
  
  dateOfOperaationsStart  = new Date ('2023-02-18')
  balacedDateWithEntries : Date[]
  FirstOpenedAccountingDate : Date;
  filterDateFormated : string;
  boardIDs = []
  searchParametersFG: FormGroup;
  filterlFormControl = new FormControl('');
  closingDate = new FormControl<Date | null>(null)
  dataRange = new FormGroup ({
    dateRangeStart: new FormControl<Date | null>(null),
    dateRangeEnd: new FormControl<Date | null>(null),
  });
  marketDataDeleted: Object;
  loadingDataState: {
    Message: string,
    State:string 
  }
  constructor(
    private AccountingDataService:AppAccountingService, 
    private MarketDataService: AppMarketDataService,
    private AuthServiceS:AuthService,  
    private AutoCompService:AtuoCompleteService,
    private HandlingCommonTasksS:HandlingCommonTasksService,
    private InstrumentDataS:InstrumentDataService,
    private CommonDialogsService:HadlingCommonDialogsService,
    private fb:FormBuilder, 
    public snack:MatSnackBar
  ) {
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToInstrumentData')[0].elementvalue;
    this.disabledControlElements = this.accessState === 'full'? false : true;
    this.InstrumentDataS.getInstrumentDataGeneral('getBoardsDataFromInstruments').subscribe(boardsData => this.boardIDs=boardsData)
    this.MarketDataService.getMarketDataSources('stock').subscribe(marketSourcesData => this.marketSources = marketSourcesData);
    this.loadingDataState = {Message:'',State: 'None'};
    this.AccountingDataService.GetbParamsgfirstOpenedDate('GetbParamsgfirstOpenedDate').subscribe(data=>{
      this.FirstOpenedAccountingDate = data[0].FirstOpenedDate;
    });
    this.searchParametersFG = this.fb.group ({
      dataRange : this.dataRange,
      secidList: null,
      amount:{value:null, disabled:true},
      marketSource : {value:null, disabled:false},
      boards : {value:null, disabled:false}
    });
    this.loadMarketData = this.fb.group ({
      dateForLoadingPrices : [new Date('2022-01-25').toISOString(), Validators.required],
      sourceCode: [[],Validators.required],
      overwritingCurrentData : [false]
    });
    this.AutoCompService.getSecidLists();
    this.secidList.setValidators(this.AutoCompService.secidValirator())
    this.filterednstrumentsLists = this.secidList.valueChanges.pipe(
      startWith(''),
      map(value => this.AutoCompService.filterList(value || '','secid'))
    );
  }
  formatDate (dateToFormat:any):string {
    let d = dateToFormat,
    month = '' + (d._d.getMonth() + 1),
    day = '' + d._d.getDate(),
    year = d._d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
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
  async getMarketData(){
    let functionToLoadData:any;
    let dateToLoad = this.formatDate(this.dateForLoadingPrices.value)
    this.loadingDataState = {Message : 'Loading', State: 'Pending'}
    this.loadedMarketData=null;
    let sourcesData: marketSourceSegements[] = this.sourceCode.value
    this.loadMarketData.disable();
    let sourceCodesArray:string[] = sourcesData.map(el=>{return el.sourceCode})
    console.log('sb',sourcesData[0].sourceGlobal);
    switch (sourcesData[0].sourceGlobal) {
      case 'marketstack.com':
        functionToLoadData = this.MarketDataService.loadMarketDataMarketStack.bind(this.MarketDataService)
      break;
      case 'iss.moex.com':
        functionToLoadData = this.MarketDataService.loadMarketDataMOEXiss.bind(this.MarketDataService)
      break;
    }
    this.MarketDataService.checkLoadedMarketData (sourceCodesArray,dateToLoad).subscribe(async data=>{
      this.loadedMarketData = data;
      if (!data.length) {
        this.logLoadingData = await functionToLoadData(sourcesData, dateToLoad);
        this.loadingDataState = {Message:'Loading is complited.', State:'Success'};
        this.marketSources.forEach(el=>el.checkedAll=false);

      }
      else {
        if (!this.overwritingCurrentData.value) { 
          this.loadMarketData.enable();
          this.loadingDataState = {Message:'Loading terminated. Data have been already loaded!', State : 'terminated'}
        } else {
          this.CommonDialogsService.confirmDialog('Delete all data for codes: ' + sourceCodesArray).subscribe(isConfirmed=>{
            if (isConfirmed.isConfirmed){
              this.MarketDataService.deleteOldMarketData(sourceCodesArray,dateToLoad).then(async rowsDeleted => {
                this.marketDataDeleted = rowsDeleted;
                this.logLoadingData = await functionToLoadData(sourcesData, dateToLoad);
                this.loadingDataState = {Message:'Have been deleted '+rowsDeleted+' of old data', State : 'Success'}
                this.marketSources.forEach(el=>el.checkedAll=false)
              })
            } else {
              this.loadMarketData.enable()
              this.loadingDataState = {Message: 'Loading has been canceled.', State: 'terminated'}
            }
          })
        }
      }
    })
  }
  async ngAfterViewInit() {
    const number = 123456.789;
    if (this.FormMode==='QuotesMode') {
      // this.MarketDataService.getMarketData().subscribe (marketData => this.updateMarketDataTable(marketData)) 
    } 
    this.MarketDataService.getReloadMarketData().subscribe(marketData => {
      this.updateMarketDataTable(marketData);
      this.loadingDataState = {State:'Success', Message:'Loading is complited'};
      this.loadMarketData.enable();
    });
    this.dateForLoadingPrices.setValue(moment(this.FirstOpenedAccountingDate))
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
  changedValueofChip (value:string) {this.instruments[this.instruments.length-1] = value}
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
    console.log('event', event.target.textContent);
    event.target.textContent.trim() === 'ClearAll cancel'? this.instruments = ['ClearAll']: null;
  }
  addChips (el: any, column: string) {(['accountNo'].includes(column))? this.instruments.push(el):null;}
  updateFilter (event:Event, el: any, column: string) {
    this.filterlFormControl.patchValue(el);
    (column=='dateBalance')? this.filterDateFormated = new Date(el).toLocaleDateString() :null
    this.dataSource.filter = el.trim();
    (this.dataSource.paginator)? this.dataSource.paginator.firstPage() : null;
  }
  clearFilter (input:HTMLInputElement) {
    input.value = '';
    this.dataSource.filter = '';
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage()}
  }
  async submitQuery () {
    return new Promise((resolve, reject) => {
      this.dataSource? this.dataSource.data=null : null;
    let searchObj = {};
    let instrumentsList = [];
    (this.instruments.indexOf('ClearAll') !== -1)? this.instruments.splice(this.instruments.indexOf('ClearAll'),1) : null;
    (this.instruments.length===1)? instrumentsList = [...this.instruments,...this.instruments]: instrumentsList = this.instruments;
    (this.instruments.length)? Object.assign (searchObj , {'secid': instrumentsList}): null;
    (this.gRange.get('dateRangeStart').value)===null? null : Object.assign (searchObj , {
      'dateRangeStart':new Date (this.gRange.get('dateRangeStart').value).toDateString()});
    (this.gRange.get('dateRangeEnd').value)===null? null : Object.assign (searchObj , {
      'dateRangeEnd': new Date (this.gRange.get('dateRangeEnd').value).toDateString()});
    ( this.marketSource.value != null&&this.marketSource.value.length !=0)? Object.assign (searchObj , {'sourcecode': this.marketSource.value}): null;
    ( this.boards.value != null&&this.boards.value.length !=0)? Object.assign (searchObj , {'boardid': this.boards.value}): null;
    this.MarketDataService.getMarketData(undefined,this.FormMode==='ChartMode'? 'tradedate ASC':undefined,searchObj).subscribe (marketData  => {
      this.dataSource  = new MatTableDataSource(marketData);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.instruments.unshift('ClearAll')
      this.FormMode==='ChartMode'? this.MarketDataService.sendMarketDataForChart(marketData) : null;
      this.CommonDialogsService.snackResultHandler({name:'success',detail: formatNumber (marketData.length,'en-US') + ' rows'},'Loaded ');
      resolve(marketData) 
    })
  })
  }
  toggleAllSelection(elem:string, allSelected: boolean) {
    allSelected? this.searchParametersFG.get(elem).patchValue(
      elem==='marketSource'? [...this.marketSources.map(item => item.segments.map(el => el.sourceCode)),0].flat() : [...this.boardIDs.map(item => item.boardid
    ), 0]) : this.searchParametersFG.get(elem).patchValue([]);
  }
   
  exportToExcel() {
   const fileName = "marketData.xlsx";
   let data = this.dataSource.data.map( (row,ind) =>({
    globalsource: row.globalsource,
    sourcecode: row. sourcecode,
    boardid: row. boardid, 
    secid: row. secid, 
    numtrades: Number(row.numtrades), 
    value: Number(row.value), 
    open: Number(row.open), 
    low: Number(row.low), 
    high: Number(row.high), 
    legalcloseprice: Number(row.legalcloseprice),
    waprice: Number(row.waprice),
    close: Number(row.close), 
    volume: Number(row.volume),
    marketprice2: Number(row.marketprice2),
    marketprice3: Number(row.marketprice3), 
    admittedquote: Number(row.admittedquote), 
    mp2valtrd: Number(row.mp2valtrd),
    admittedvalue: Number(row.admittedvalue),
    waval: Number(row.waval), 
    tradingsession: row. tradingsession,
    tradedate: new Date(row.tradedate)
  }))
  this.HandlingCommonTasksS.exportToExcel (data,"marketData")
 }
  getMoexSecurities (){
    this.MarketDataService.getMoexInstrumentsList().subscribe(data=>console.log('inserted - ',data))
  }
  msQuoteToMT (){
    let dateToLoad = this.formatDate(this.dateForLoadingPrices.value)
    this.MarketDataService.moveMarketStackToMainTable(dateToLoad).subscribe(data=> {
      console.log('row',data)
      this.CommonDialogsService.snackResultHandler({name:'success',detail: data[0].o_rows_moved + ' rows'},'Copied ')
    })  
  }
  get  gRange () {return this.searchParametersFG.get('dataRange') } 
  get  dateRangeStart() {return this.searchParametersFG.get('dateRangeStart') } 
  get  dateRangeEnd() {return this.searchParametersFG.get('dateRangeEnd') } 
  get  marketSource () {return this.searchParametersFG.get('marketSource') } 
  get  boards () {return this.searchParametersFG.get('boards') } 
  get  secidList () {return this.searchParametersFG.get('secidList') } 
  
  get dateForLoadingPrices() {return this.loadMarketData.get('dateForLoadingPrices')}
  get sourceCode() {return this.loadMarketData.get('sourceCode')}
  get overwritingCurrentData() {return this.loadMarketData.get('overwritingCurrentData')}
  
}