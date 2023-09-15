import { Component, EventEmitter, Output, ViewChild, Input, AfterViewInit} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {map, Observable, startWith, switchMap, tap } from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import { currencyRateList,  marketDataSources, marketSourceSegements } from 'src/app/models/intefaces.model';
import { AppAccountingService } from 'src/app/services/accounting.service';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {MatChipInputEvent} from '@angular/material/chips';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatOption } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as moment from 'moment';
import { AtuoCompleteService } from 'src/app/services/auto-complete.service';
import { formatNumber, registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { HandlingCommonTasksService } from 'src/app/services/handling-common-tasks.service';
import { AuthService } from 'src/app/services/auth.service';
import { CurrenciesDataService } from 'src/app/services/currencies-data.service';
import { AppMarketDataService } from 'src/app/services/market-data.service';
registerLocaleData(localeFr, 'fr');
@Component({
  selector: 'app-table-currencies-data',
  templateUrl: './currencies-data-table.component.html',
  styleUrls: ['./currencies-data-table.component.scss'],
})
export class AppTableCurrenciesDataComponent  implements AfterViewInit {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  @Input() FormMode:string = 'Full'
  loadMarketData: FormGroup;
  marketSources:marketDataSources[] =  [];
  columnsToDisplay=['id','pair', 'base_code','base_iso','quote_code','quote_iso','rate','rate_date','rate_type','nominal','sourcecode'];
  columnsHeaderToDisplay=['ID','Pair','Base1','Base2','Quote1','Quote2','Rate','Date','RateType','Ratio','Source'];
  dataSource: MatTableDataSource<currencyRateList>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @Output() public modal_principal_parent = new EventEmitter();
  statusLogPanelOpenState:boolean=false;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  
  @ViewChild('allSelected') private allSelected: MatOption;
  public readOnly: boolean = false; 
  panelOpenStateFirst = false;
  panelOpenStateSecond = true;
  action ='';
  pairs: string[] = ['ClearAll'];
  filteredPairsLists : Observable<string[]>;
  
  dateOfOperaationsStart  = new Date ('2023-02-18')
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
    message: string,
    state:string, 
    deletedCount:number,
    loadedCount:number
  }
  constructor(
    private AccountingDataService:AppAccountingService, 
    private CurrenciesDataSrv: CurrenciesDataService,
    private MarketDataService: AppMarketDataService,
    private AuthServiceS:AuthService,  
    private AutoCompService:AtuoCompleteService,
    private HandlingCommonTasksS:HandlingCommonTasksService,
    private CommonDialogsService:HadlingCommonDialogsService,
    private fb:FormBuilder, 
    public snack:MatSnackBar
  ) {
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToInstrumentData')[0].elementvalue;
    this.disabledControlElements = this.accessState === 'full'? false : true;
    this.MarketDataService.getMarketDataSources('currency').subscribe(marketSourcesData => this.marketSources = marketSourcesData);
    this.loadingDataState={message:'',state:'None',deletedCount:0,loadedCount:0}
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
    this.AutoCompService.getCurrencyPairsList().then();
    this.secidList.setValidators(this.AutoCompService.secidValirator())
    this.filteredPairsLists = this.secidList.valueChanges.pipe(
      startWith(''),
      map(value => this.AutoCompService.filterList(value || '','currencyPairs'))
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
  completeLoading (currencyData:currencyRateList[]){
    this.updateCurrencyDataTable(currencyData);
    this.loadingDataState.state = 'Success';
    this.loadingDataState.message = 'Loading is complited';
    this.loadingDataState.loadedCount = currencyData.length;
    this.loadMarketData.enable();
    this.marketSources.forEach(el=>{
      el.checkedAll=false;
      el.segments.forEach(el=>el.checked=false)
    });
    this.overwritingCurrentData.patchValue(false)
  }
  async getRatestData(){
    let functionToLoadData:any;
    let dateToLoad = this.formatDate(this.dateForLoadingPrices.value)
    this.loadingDataState={message:'Loading',state:'Pending',deletedCount:0,loadedCount:0}
    let sourcesData: marketSourceSegements[] = this.sourceCode.value
    this.loadMarketData.disable();
    let sourceCodesArray:string[] = sourcesData.map(el=>{return el.sourceCode})
    switch (sourcesData[0].sourceGlobal) {
      case 'cbr.ru':
        functionToLoadData = this.CurrenciesDataSrv.getCbrRateDaily.bind(this.CurrenciesDataSrv)
      break;
    }
    await functionToLoadData(sourcesData, dateToLoad,'getRatesDate').pipe(
      tap(data=> console.log('date to check ',data)),
      switchMap (ratesDate=>this.CurrenciesDataSrv.checkLoadedRatesData (sourceCodesArray,ratesDate['dateToCheck'].toString()))
    ).subscribe(async data=>{
      if (!data.length) {
       await functionToLoadData(sourcesData, dateToLoad,undefined).subscribe(currencyData => this.completeLoading(currencyData))
      }
      else {
        if (!this.overwritingCurrentData.value) { 
          this.loadMarketData.enable();
          this.loadingDataState = {message:'Loading terminated. Data have been already loaded!', state : 'terminated',deletedCount:0,loadedCount:0}
        } else {
          this.CommonDialogsService.confirmDialog('Delete all rates for the date '+ dateToLoad+ ' and codes ' + sourceCodesArray).subscribe(isConfirmed=>{
            if (isConfirmed.isConfirmed){
              this.CurrenciesDataSrv.deleteOldRateData(sourceCodesArray,dateToLoad).subscribe(async rowsDeleted => {
                this.marketDataDeleted = rowsDeleted;
                this.loadingDataState.deletedCount = rowsDeleted.length;
                await functionToLoadData(sourcesData, dateToLoad,undefined).subscribe(currencyData => this.completeLoading(currencyData))
                this.marketSources.forEach(el=>el.checkedAll=false)
              })
            } else {
              this.loadMarketData.enable()
              this.loadingDataState.message= 'Loading has been canceled.';
              this.loadingDataState.state= 'terminated';
            }
          })
        }
      }
    }) 
  }
  async ngAfterViewInit() {
    const number = 123456.789;
    this.CurrenciesDataSrv.getCurrencyRatesList().subscribe (currencyData => this.updateCurrencyDataTable(currencyData)) 
    this.dateForLoadingPrices.setValue(moment(this.FirstOpenedAccountingDate))
    // this.dateForLoadingPrices.setValue(moment(new Date('2023/07/26')))
  }
  updateCurrencyDataTable (currencyData:currencyRateList[]) {
    this.dataSource  = new MatTableDataSource(currencyData);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage();}
  }
  changedValueofChip (value:string) {this.pairs[this.pairs.length-1] = value}
  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    const valueArray = event.value.split(',');
    (value)? this.pairs = [...this.pairs,...valueArray] : null;
    event.chipInput!.clear();
  }
  remove(account: string): void {
    const index = this.pairs.indexOf(account);
   (index >= 0)? this.pairs.splice(index, 1) : null
  }
  clearAll(event) {
    console.log('event', event.target.textContent);
    event.target.textContent.trim() === 'ClearAll cancel'? this.pairs = ['ClearAll']: null;
  }
  addChips (el: any, column: string) {(['accountNo'].includes(column))? this.pairs.push(el):null;}
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
    let pairsList = [];
    (this.pairs.indexOf('ClearAll') !== -1)? this.pairs.splice(this.pairs.indexOf('ClearAll'),1) : null;
    (this.pairs.length===1)? pairsList = [...this.pairs,...this.pairs]: pairsList = this.pairs;
    (this.pairs.length)? Object.assign (searchObj , {'pairs': pairsList}): null;
    (this.gRange.get('dateRangeStart').value)===null? null : Object.assign (searchObj , {
      'dateRangeStart':new Date (this.gRange.get('dateRangeStart').value).toDateString()});
    (this.gRange.get('dateRangeEnd').value)===null? null : Object.assign (searchObj , {
      'dateRangeEnd': new Date (this.gRange.get('dateRangeEnd').value).toDateString()});
    ( this.marketSource.value != null&&this.marketSource.value.length !=0)? Object.assign (searchObj , {'sourcecode': this.marketSource.value}): null;
    this.CurrenciesDataSrv.getCurrencyRatesList(searchObj).subscribe (marketData  => {
      this.dataSource  = new MatTableDataSource(marketData);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.pairs.unshift('ClearAll')
      this.CommonDialogsService.snackResultHandler({name:'success',detail: formatNumber (marketData.length,'en-US') + ' rows'},'Loaded ');
      resolve(marketData) 
    })
  })
  }
  toggleAllSelection(elem:string, allSelected: boolean) {
    allSelected? this.searchParametersFG.get(elem).patchValue([...this.marketSources.map(item => item.segments.map(el => el.sourceCode)),0].flat()) : this.searchParametersFG.get(elem).patchValue([]);
  }
   
  exportToExcel() {
   const fileName = "marketData.xlsx";
   let data = this.dataSource.data
/*    .map( (row,ind) =>({
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
  })) */
  this.HandlingCommonTasksS.exportToExcel (data,"currencyData")
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