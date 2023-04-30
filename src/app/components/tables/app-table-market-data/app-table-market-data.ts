import {AfterViewInit, Component, ViewEncapsulation, EventEmitter, Output, ViewChild, Input} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {lastValueFrom, map, Observable, startWith, Subscription } from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {TreeMenuSevice } from 'src/app/services/tree-menu.service';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { marketData, marketDataSources, marketSourceSegements } from 'src/app/models/accounts-table-model';
import { AppAccountingService } from 'src/app/services/app-accounting.service';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {MatChipInputEvent} from '@angular/material/chips';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import * as XLSX from 'xlsx'
import { MatOption } from '@angular/material/core';
import { AppTableAccAccountsComponent } from '../app-table-acc-accounts/app-table-acc-accounts';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppConfimActionComponent } from '../../alerts/app-confim-action/app-confim-action.component';
import { MatCalendarCellClassFunction } from '@angular/material/datepicker';
import { AppMarketDataService } from 'src/app/services/app-market-data.service';
import * as moment from 'moment';
import { AtuoCompSecidService } from 'src/app/services/atuo-comp-secid.service';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { menuColorGl } from 'src/app/models/constants';
registerLocaleData(localeFr, 'fr');
/* 
export class extends  */
@Component({
  
  selector: 'app-table-market-data',
  templateUrl: './app-table-market-data.html',
  styleUrls: ['./app-table-market-data.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class AppTableMarketDataComponent  implements AfterViewInit {
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
  private subscriptionName: Subscription;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  
  @ViewChild('allSelected') private allSelected: MatOption;
  menuColorGl=menuColorGl
  public readOnly: boolean = false; 
  addOnBlur = true;
  panelOpenStateFirst = false;
  panelOpenStateSecond = false;
  
  accessToClientData: string = 'true';
  action ='';
  instruments: string[] = ['ClearAll'];
  psearchParameters: any;
  
  dialogChooseAccountsList: MatDialogRef<AppTableAccAccountsComponent>;
  public filterednstrumentsLists : Observable<string[]>;
  
  dateOfOperaationsStart  = new Date ('2023-02-18')
  balacedDateWithEntries : Date[]
  FirstOpenedAccountingDate : Date;
  filterDateFormated : string;
  boardIDs:string[] = ["XNAS", "AGRO", "FQBR", "INAV", "MMIX", "RTSI", "SDII", "SMAL", "SNDX", "TQBD", "TQBR", "TQCB", "TQFD", "TQFE", "TQIF", "TQIR", "TQIU", "TQOB", "TQOD", "TQOE", "TQPI", "TQRD", "TQTD", "TQTE", "TQTF"]
  searchParametersFG: FormGroup;
  filterlFormControl = new FormControl('');
  closingDate = new FormControl<Date | null>(null)
  dataRange = new FormGroup ({
    dateRangeStart: new FormControl<Date | null>(null),
    dateRangeEnd: new FormControl<Date | null>(null),
  });
  marketDataDeleted: Object;
  loadingDataState: {
    Message: string ,
    State:string 
  }

  constructor(
    private AccountingDataService:AppAccountingService, 
    private MarketDataService: AppMarketDataService,
    private TreeMenuSevice:TreeMenuSevice, 
    private AtuoCompService:AtuoCompSecidService,
    private CommonDialogsService:HadlingCommonDialogsService,
    private dialog: MatDialog,
    private fb:FormBuilder, 
    public snack:MatSnackBar
  ) {
    this.loadingDataState = {Message:'',State: 'Pending'};
    this.AccountingDataService.GetbLastClosedAccountingDate(null,null,null,null,'GetbLastClosedAccountingDate').subscribe(data=>{
      this.FirstOpenedAccountingDate = data[0].FirstOpenedDate;
    });
    this.MarketDataService.getMarketDataSources().subscribe(marketSourcesData => this.marketSources = marketSourcesData);
    this.MarketDataService.getMarketData().subscribe (marketData => {
      this.updateMarketDataTable(marketData);
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
    this.AtuoCompService.getSecidLists('get_secid_array');
    this.filterednstrumentsLists = this.searchParametersFG.controls['secidList'].valueChanges.pipe(
      startWith(''),
      map(value => this.AtuoCompService.filter(value || ''))
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
    console.log('disableAllexceptOne',this.marketSources[index].checkedAll,this.marketSources[index].indeterminate,disableOtherSources);
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
        console.log('this.loadMarketData.enable()')
        // this.loadingDataState = {Message:'Loading is complited.', State:'Success'};
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
                console.log('rowsDeleted',rowsDeleted);
                this.marketDataDeleted = rowsDeleted;
                this.logLoadingData = await functionToLoadData(sourcesData, dateToLoad);
                // this.loadMarketData.enable();
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
    console.log(new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(number));
    this.MarketDataService.getReloadMarketData().subscribe(marketData => {
      this.updateMarketDataTable(marketData);
      this.loadingDataState = {State:'Success', Message:'Loading is complited'};
      this.loadMarketData.enable();
    });
    this.dateForLoadingPrices.setValue(moment('Mon Apr 10 2023 00:00:00 GMT+0300 (Moscow Standard Time)'))
    let userData = JSON.parse(localStorage.getItem('userInfo'))
    await lastValueFrom (this.TreeMenuSevice.getaccessRestriction (userData.user.accessrole, 'accessToClientData'))
    .then ((accessRestrictionData) =>{
      this.accessToClientData = accessRestrictionData['elementvalue']
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
  clearFilter () {
    this.filterlFormControl.patchValue('')
    this.dataSource.filter = ''
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage()}
  }
  async submitQuery () {
    return new Promise((resolve, reject) => {
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
    this.MarketDataService.getMarketData(10000,this.FormMode==='ChartMode'? 'tradedate ASC':undefined,searchObj).subscribe (marketData  => {
      this.dataSource  = new MatTableDataSource(marketData);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.instruments.unshift('ClearAll')
      this.FormMode==='ChartMode'? this.MarketDataService.sendMarketDataForChart(marketData) : null;
      resolve(marketData) 
    })
  })
  }
  toggleAllSelection() {
   
  }
  exportToExcel() {
   const fileName = "marketData.xlsx";
   let obj = this.dataSource.data.map( (row,ind) =>({
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

   const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(obj);
   const wb: XLSX.WorkBook = XLSX.utils.book_new();
   XLSX.utils.book_append_sheet(wb, ws, "marketData");
   XLSX.writeFile(wb, fileName);
  }
  dateClass: MatCalendarCellClassFunction<Date> = (cellDate, view) => {
    let result :string
    // console.log('dc',cellDate.toLocaleDateString(), new Date(this.balacedDateWithEntries[1]).toLocaleDateString());
    const index = this.balacedDateWithEntries.findIndex(x => new Date(x).toLocaleDateString() == cellDate.toLocaleDateString());
    return (index > -1)? 'date-orange' : '';
  };
  getMoexSecurities (){
    this.MarketDataService.getMoexInstrumentsList().subscribe(data=>console.log('inserted - ',data))
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