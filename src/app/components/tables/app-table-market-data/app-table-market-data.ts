import {AfterViewInit, Component, ViewEncapsulation, EventEmitter, Output, ViewChild} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {lastValueFrom, Subscription } from 'rxjs';
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

  loadMarketData: FormGroup;
  marketSources:marketDataSources[] =  [] 
  marketDataToLoad: any;
  columnsToDisplay = ['globalsource','sourcecode','boardid','tradedate','secid','value', 'open', 'low', 'high', 'close','numtrades', 'volume','marketprice2', 'marketprice3', 'admittedquote', 'waprice'];
  columnsHeaderToDisplay = ['Source','code','boardid','tradedate','secid','value', 'open', 'low', 'high', 'close', 'numtrades', 'volume','marketprice2', 'marketprice3', 'admittedquote' ,'waprice'];
  dataSource: MatTableDataSource<marketData>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @Output() public modal_principal_parent = new EventEmitter();
  logLoadingData=[];
  statusLogPanelOpenState:boolean=false;
  private subscriptionName: Subscription;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  
  @ViewChild('allSelected') private allSelected: MatOption;

  public readOnly: boolean = false; 
  addOnBlur = true;
  panelOpenStateFirst = false;
  panelOpenStateSecond = false;
  
  accessToClientData: string = 'true';
  action ='';
  instruments: string[] = ['ClearAll'];
  psearchParameters: any;
  
  dialogChooseAccountsList: MatDialogRef<AppTableAccAccountsComponent>;
 
  
  dateOfOperaationsStart  = new Date ('2023-02-18')
  balacedDateWithEntries : Date[]
  FirstOpenedAccountingDate : Date;
  filterDateFormated : string;

  searchParametersFG: FormGroup;
  filterlFormControl = new FormControl('');
  closingDate = new FormControl<Date | null>(null)
  dataRange = new FormGroup ({
    dateRangeStart: new FormControl<Date | null>(null),
    dateRangeEnd: new FormControl<Date | null>(null),
  });

  constructor(
    private AccountingDataService:AppAccountingService, 
    private MarketDataService: AppMarketDataService,
    private TreeMenuSevice:TreeMenuSevice, 
    private dialog: MatDialog,
    private fb:FormBuilder, 
    public snack:MatSnackBar
  ) {
    this.AccountingDataService.GetbLastClosedAccountingDate(null,null,null,null,'GetbLastClosedAccountingDate').subscribe(data=>{
      this.FirstOpenedAccountingDate = data[0].FirstOpenedDate;
    })
    this.MarketDataService.getMarketDataSources().subscribe((marketSourcesData) => {
      this.marketSources = marketSourcesData;
      console.log('marketSourcesData', this.marketSources);
      
    })
    this.searchParametersFG = this.fb.group ({
      dataRange : this.dataRange,
      noAccountLedger: null,
      amount:{value:null, disabled:true},
      entryType : {value:[], disabled:true}
    })
    this.loadMarketData = this.fb.group ({
      dateForLoadingPrices : [new Date('2022-01-19'), Validators.required],
      sourceCode: [[],Validators.required],
      overwritingCurrentData : [null]
    })
  }
  updateAllComplete(index:number) {
    this.marketSources[index].checkedAll = this.marketSources[index].segments != null && this.marketSources[index].segments.every(t => t.checked); 
    this.marketSources[index].indeterminate = this.marketSources[index].segments.filter(t => t.checked).length > 0 && !this.marketSources[index].checkedAll; 
    this.showSelectedSources();
  }
  showSelectedSources() {
    let sourceIdToLoad =[]
    this.marketSources.forEach(source => source.segments.forEach(segment => segment.checked? sourceIdToLoad.push(segment):null))
    this.sourceCode.setValue(sourceIdToLoad)
    console.log('updateAllComplete', this.sourceCode.value);
  }

  setAll(index: number) {
    this.marketSources[index].segments.forEach(t => (t.checked = this.marketSources[index].checkedAll)); 
    this.showSelectedSources();
  }
  async getMarketData(){
    let sourceCodesList: marketSourceSegements[] = this.sourceCode.value
    let dateToLoad = new Date(this.dateForLoadingPrices.value).toISOString().slice(0,10);
    console.log('AAAdate',this.dateForLoadingPrices.value, dateToLoad, new Date(this.dateForLoadingPrices.value).toISOString() );
    this.logLoadingData = await this.MarketDataService.loadMarketDataExteranalSource(sourceCodesList, dateToLoad)
    this.MarketDataService.getMarketData().subscribe (marketData => {
      this.dataSource  = new MatTableDataSource(marketData);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    })

     }
  async ngAfterViewInit() {
    let userData = JSON.parse(localStorage.getItem('userInfo'))
    await lastValueFrom (this.TreeMenuSevice.getaccessRestriction (userData.user.accessrole, 'accessToClientData'))
    .then ((accessRestrictionData) =>{
      this.accessToClientData = accessRestrictionData['elementvalue']
      this.MarketDataService.getMarketData().subscribe (marketData => {
        this.dataSource  = new MatTableDataSource(marketData);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      })
    })
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage();}
  }
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
    let accountsList = [];
    (this.instruments.indexOf('ClearAll') !== -1)? this.instruments.splice(this.instruments.indexOf('ClearAll'),1) : null;
    (this.instruments.length===1)? accountsList = [...this.instruments,...this.instruments]: accountsList = this.instruments;
    (this.instruments.length)? Object.assign (searchObj , {'noAccountLedger': accountsList}): null;
    (this.gRange.get('dateRangeStart').value)===null? null : Object.assign (searchObj , {
      'dateRangeStart':new Date (this.gRange.get('dateRangeStart').value).toDateString()});
    (this.gRange.get('dateRangeEnd').value)===null? null : Object.assign (searchObj , {
      'dateRangeEnd': new Date (this.gRange.get('dateRangeEnd').value).toDateString()});
    ( this.entryTypes.value != null&&this.entryTypes.value.length !=0)? Object.assign (searchObj , {'entryTypes': [this.entryTypes.value]}): null;
    this.MarketDataService.getMarketData().subscribe (marketData  => {
      this.dataSource  = new MatTableDataSource(marketData);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.instruments.unshift('ClearAll')
      resolve(marketData) 
    })
  })
  }
  selectAccounts (typeAccount: string) {
    this.dialogChooseAccountsList = this.dialog.open(AppTableAccAccountsComponent ,{minHeight:'600px', minWidth:'1700px', autoFocus: false, maxHeight: '90vh'});
    this.dialogChooseAccountsList.componentInstance.action = "GetALLAccountsDataWholeList";
    this.dialogChooseAccountsList.componentInstance.readOnly = true;
    this.dialogChooseAccountsList.componentInstance.multiSelect = true;
    this.dialogChooseAccountsList.componentInstance.modal_principal_parent.subscribe ((item)=>{
      this.instruments = [...this.instruments,...this.dialogChooseAccountsList.componentInstance.accounts]
      this.dialogChooseAccountsList.close(); 
    });
  }
  toggleAllSelection() {
   
  }
  exportToExcel() {
   const fileName = "balancesData.xlsx";
   let obj = this.dataSource.data.map( (row,ind) =>({
/*     'accountId': Number(row.accountId),
    'accountNo' : row.accountNo,
    'dateBalance' : new Date (row.dateBalance),
    'openingBalance': Number(row.openingBalance),
    'totalDebit': Number(row.totalDebit),
    'totalCredit': Number(row.totalCredit),
    'outBalance' : Number(row.OutGoingBalance),
    'xacttypecode': (row.accountType) */
  }))

   const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(obj);
   const wb: XLSX.WorkBook = XLSX.utils.book_new();
   XLSX.utils.book_append_sheet(wb, ws, "balancesData");
   XLSX.writeFile(wb, fileName);
  }
  async updateResultHandler (result :any, action: string) {
    console.log('res',result);
    if (result['name']=='error') {
      this.snack.open('Error: ' + result['detail'].split("\n", 1).join(""),'OK',{panelClass: ['snackbar-error']}); 
    } else {
      this.snack.open(action +': ' + result + ' entry','OK',{panelClass: ['snackbar-success'], duration: 3000});
      this.dialog.closeAll();
      await this.submitQuery();
      this.AccountingDataService.GetbLastClosedAccountingDate(null,null,null,null,'GetbLastClosedAccountingDate').subscribe(data=>{
        this.FirstOpenedAccountingDate = data[0].FirstOpenedDate;
      })
      this.AccountingDataService.GetbbalacedDateWithEntries('GetbbalacedDateWithEntries').subscribe(data => {
        this.balacedDateWithEntries = data.flat()
        console.log('date',this.balacedDateWithEntries);
      })
      this.AccountingDataService.GetbAccountingDateToClose('GetbAccountingDateToClose').subscribe(data => {
      })
    }
  }



  dateClass: MatCalendarCellClassFunction<Date> = (cellDate, view) => {
    let result :string
    // console.log('dc',cellDate.toLocaleDateString(), new Date(this.balacedDateWithEntries[1]).toLocaleDateString());
    const index = this.balacedDateWithEntries.findIndex(x => new Date(x).toLocaleDateString() == cellDate.toLocaleDateString());
    return (index > -1)? 'date-orange' : '';
  };
      get  gRange () {return this.searchParametersFG.get('dataRange') } 
  get  dateRangeStart() {return this.searchParametersFG.get('dateRangeStart') } 
  get  dateRangeEnd() {return this.searchParametersFG.get('dateRangeEnd') } 
  get  entryTypes () {return this.searchParametersFG.get('entryType') } 
  
  get dateForLoadingPrices() {return this.loadMarketData.get('dateForLoadingPrices')}
  get sourceCode() {return this.loadMarketData.get('sourceCode')}

}