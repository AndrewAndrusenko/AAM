import { Component, ViewChild, Input, ChangeDetectionStrategy} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {catchError, EMPTY, map, Observable, startWith, Subscription } from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import { currencyPair, currencyRateList,  marketDataSources } from 'src/app/models/interfaces.model';
import { AppAccountingService } from 'src/app/services/accounting.service';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {MatChipInputEvent} from '@angular/material/chips';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatOption } from '@angular/material/core';
import { AtuoCompleteService } from 'src/app/services/auto-complete.service';
import { DatePipe, formatNumber, registerLocaleData } from '@angular/common';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { HandlingCommonTasksService } from 'src/app/services/handling-common-tasks.service';
import { AuthService } from 'src/app/services/auth.service';
import { CurrenciesDataService } from 'src/app/services/currencies-data.service';
import { indexDBService } from 'src/app/services/indexDB.service';
@Component({
  selector: 'app-table-currencies-data',
  changeDetection:ChangeDetectionStrategy.OnPush,
  templateUrl: './currencies-data-table.component.html',
  styleUrls: ['./currencies-data-table.component.scss'],
})
export class AppTableCurrenciesDataComponent {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  private subscriptions = new Subscription()
  loadMarketData: FormGroup;
  marketSources:marketDataSources[] =  [];
  columnsToDisplay=['id','pair', 'base_code','base_iso','quote_code','quote_iso','rate','inderect_rate','rate_date','rate_type','nominal','sourcecode'];
  columnsHeaderToDisplay=['ID','Pair','Base1','Base2','Quote1','Quote2','Rate','InD_Rate','Date','RateType','Ratio','Source'];
  dataSource: MatTableDataSource<currencyRateList>;
  @Input() FormMode:string = 'Full'
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  statusLogPanelOpenState:boolean=false;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  @ViewChild('allSelected') private allSelected: MatOption;
  public readOnly: boolean = false; 
  panelOpenStateFirst = true;
  panelOpenStateSecond = true;
  pairs: string[] = ['ClearAll'];
  datePipe: DatePipe;
  filteredPairsLists : Observable<currencyPair[]>;
  FirstOpenedAccountingDate : Date;
  filterDateFormated : string;
  searchParametersFG: FormGroup;
  filterlFormControl = new FormControl('');
  dataRange = new FormGroup ({
    dateRangeStart: new FormControl<Date | null>(null),
    dateRangeEnd: new FormControl<Date | null>(null),
  });
  loadingDataState: {
    message: string,
    state:string, 
    deletedCount:number,
    loadedCount:number
  }
  constructor(
    private AccountingDataService:AppAccountingService, 
    private currenciesDataService: CurrenciesDataService,
    private indexDBService: indexDBService,
    private AuthServiceS:AuthService,  
    private AutoCompService:AtuoCompleteService,
    private handlingCommonTasksService:HandlingCommonTasksService,
    private CommonDialogsService:HadlingCommonDialogsService,
    private fb:FormBuilder, 
  ) {
    this.datePipe = new DatePipe ('en-US')
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToInstrumentData')[0].elementvalue;
    this.disabledControlElements = this.accessState === 'full'? false : true;
    this.indexDBService.pipeMarketSourceSet.next(true);
    this.subscriptions.add(this.indexDBService.receivMarketSourceSett().subscribe(marketSourcesData => {
      this.marketSources = marketSourcesData.filter(el=>el.type==='currency');
      this.marketSources[0].checkedAll=true;
      this.setAll(0);
    }));

    // this.MarketDataService.getMarketDataSources('currency').subscribe(marketSourcesData => this.marketSources = marketSourcesData);
    this.loadingDataState={message:'',state:'None',deletedCount:0,loadedCount:0}
    this.searchParametersFG = this.fb.group ({
      dataRange : this.dataRange,
      secidList: null,
      marketSource : {value:null, disabled:false},
      boards : {value:null, disabled:false}
    });
    this.AccountingDataService.GetbParamsgfirstOpenedDate('GetbParamsgfirstOpenedDate').subscribe(data=>{
      this.FirstOpenedAccountingDate = data[0].FirstOpenedDate;
      this.dateForLoadingPrices.setValue(new Date(this.FirstOpenedAccountingDate));
    });
    this.loadMarketData = this.fb.group ({
      dateForLoadingPrices : [new Date(), Validators.required],
      sourceCode: [[],Validators.required],
      overwritingCurrentData : [false]
    });
    this.AutoCompService.getCurrencyPairsList();
    this.secidList.setValidators(this.AutoCompService.secidValirator())
    this.filteredPairsLists = this.secidList.valueChanges.pipe(
      startWith(''),
      map(value => this.AutoCompService.filterList(value || '','currencyPairs') as currencyPair[])
    );
    this.currenciesDataService.getCurrencyRatesList().subscribe (currencyData => this.updateCurrencyDataTable(currencyData)) 
  }
  ngOnDestroy(): void {this.subscriptions.unsubscribe()}
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
    currencyData!==null? this.updateCurrencyDataTable(currencyData):null;
    this.loadMarketData.enable();
    this.loadMarketData.reset();
    this.dateForLoadingPrices.setValue(new Date(this.FirstOpenedAccountingDate));

    this.marketSources.forEach(el=>{
      el.checkedAll=false;
      el.segments.forEach(el=>el.checked=false)
    });
    this.overwritingCurrentData.patchValue(false)
  }
  getRatestData(){
    this.loadingDataState.state='Pending';
    this.currenciesDataService.getRatestData( this.datePipe.transform(this.dateForLoadingPrices.value,'YYYY-MM-dd'),this.sourceCode.value,this.overwritingCurrentData.value).pipe (
      catchError((err)=>{
        let errMsg:string =''
        console.log('CBR RatestData error',err);
        this.loadingDataState.state='Error'
        switch (err.error.code) {
          case 'ENOTFOUND':
            errMsg='There is no accesss to cbr.ru'  
          break;
          default:
            errMsg=err.error.hasOwnProperty('detail')? err['error']['detail'].split('\n')[0]:'There is no accesss to to cbr.ru'  
          break;
        }
        this.CommonDialogsService.snackResultHandler({name:'error',detail:errMsg})
        return EMPTY;
      })
    ).subscribe(loadingDataState=>{
      this.loadingDataState = loadingDataState;
      this.completeLoading(loadingDataState.data)
    }) 
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
  changedValueofChip (value:string) {this.pairs[this.pairs.length-1] === 'ClearAll'? this.pairs.push(value) : this.pairs[this.pairs.length-1] = value}
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
  clearAll(event:MouseEvent) {
    event.target['textContent'].trim() === 'ClearAll'? this.pairs = ['ClearAll']: null;
  }
  addChips (el: string, column: string) {(['accountNo'].includes(column))? this.pairs.push(el):null;}
  updateFilter (el: string, column: string) {
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
  submitQuery () {
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
    this.currenciesDataService.getCurrencyRatesList(searchObj).subscribe (marketData  => {
      this.dataSource  = new MatTableDataSource(marketData);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.pairs.unshift('ClearAll')
      this.CommonDialogsService.snackResultHandler({name:'success',detail: formatNumber (marketData.length,'en-US') + ' rows'},'Loaded ');
    })
  }
  toggleAllSelection(elem:string, allSelected: boolean) {
    allSelected? 
    this.searchParametersFG.get(elem).patchValue(
      [...this.marketSources.map(item => 
        item.segments.map(el => el.sourceCode)),0].flat()
    ) : this.searchParametersFG.get(elem).patchValue([]);
  }
  exportToExcel() {
   let numberFields=['base_code','quote_code','rate','inderect_rate','rate_type','nominal'];
   let dateFields=['rate_date'];
   this.handlingCommonTasksService.exportToExcel (this.dataSource.data,"currencyData",numberFields,dateFields);  
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