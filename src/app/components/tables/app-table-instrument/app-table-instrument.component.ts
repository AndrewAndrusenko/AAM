import {AfterViewInit, Component, ViewEncapsulation, EventEmitter, Output, ViewChild, Input, OnInit} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {lastValueFrom, Observable, Subscription } from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {TreeMenuSevice } from 'src/app/services/tree-menu.service';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { Instruments, marketDataSources } from 'src/app/models/accounts-table-model';
import { AppAccountingService } from 'src/app/services/app-accounting.service';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {MatChipInputEvent} from '@angular/material/chips';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import * as XLSX from 'xlsx'
import { MatOption } from '@angular/material/core';
import { AppTableAccAccountsComponent } from '../app-table-acc-accounts/app-table-acc-accounts';
import { AppMarketDataService } from 'src/app/services/app-market-data.service';
import { menuColorGl,investmentNodeColor, investmentNodeColorChild, additionalLightGreen } from 'src/app/models/constants';
@Component({
  selector: 'app-app-instrument-table',
  templateUrl: './app-table-instrument.component.html',
  styleUrls: ['./app-table-instrument.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class AppInstrumentTableComponent  implements AfterViewInit,OnInit {
  @Input() FormMode:string = 'Full'
  marketSources:marketDataSources[] =  [];
  columnsToDisplay = [ 
    'secid', 
    'security_type_title',
    'shortname', 
    'isin', 
    'primary_boardid', 
    'board_title', 
    'name', 
    'emitent_inn', 
  ];
  columnsHeaderToDisplay = [ 
    'SECID', 
    'Security_Type',
    'Short Name', 
    'ISIN', 
    'Primary_Board', 
    'Board Title', 
    'Issuer', 
    'Issuer INN', 
  ];
  dataSource: MatTableDataSource<Instruments>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @Output() public modal_principal_parent = new EventEmitter();
  private subscriptionName: Subscription;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  
  menuColorGl=menuColorGl
  addOnBlur = true;
  panelOpenStateSecond = false;
  
  accessToClientData: string = 'true';
  instruments: string[] = ['ClearAll'];
  investmentNodeColor = investmentNodeColorChild;
  additionalLightGreen = additionalLightGreen;
  public filterednstrumentsLists : Observable<string[]>;
  
  boardIDs =[]
  searchParametersFG: FormGroup;
  filterlFormControl = new FormControl('');
  filterlAllFormControl = new FormControl('');


  defaultFilterPredicate?: (data: any, filter: string) => boolean;
  secidfilter?: (data: any, filter: string) => boolean;
  constructor(
    private AccountingDataService:AppAccountingService, 
    private MarketDataService: AppMarketDataService,
    private TreeMenuSevice:TreeMenuSevice, 
    private dialog: MatDialog,
    private fb:FormBuilder, 
  ) {
    let c = investmentNodeColor
    this.MarketDataService.getInstrumentDataGeneral('getBoardsDataFromInstruments').subscribe(boardsData => this.boardIDs=boardsData)
    this.MarketDataService.getMarketDataSources().subscribe(marketSourcesData => this.marketSources = marketSourcesData);
    this.MarketDataService.getMoexInstruments().subscribe (instrumentData => {
      this.updateInstrumentDataTable(instrumentData);
    });      
    this.searchParametersFG = this.fb.group ({
      secidList: null,
      amount:{value:null, disabled:true},
      marketSource : {value:null, disabled:false},
      boards : {value:null, disabled:false}
    });
  }
  instrumentDetails (elemnt:Instruments) {

  }

  ngOnInit(): void {
    this.defaultFilterPredicate = this.dataSource.filterPredicate;
  }
  async ngAfterViewInit() {
    let userData = JSON.parse(localStorage.getItem('userInfo'))
    await lastValueFrom (this.TreeMenuSevice.getaccessRestriction (userData.user.accessrole, 'accessToClientData'))
    .then ((accessRestrictionData) =>{
      this.accessToClientData = accessRestrictionData['elementvalue']
    })
  }
  updateInstrumentDataTable (instrumentData:Instruments[]) {
    this.dataSource  = new MatTableDataSource(instrumentData);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.defaultFilterPredicate = this.dataSource.filterPredicate;
    
    this.dataSource.filterPredicate = function(data, filter: string): boolean {
      return data.secid.toLowerCase().includes(filter) 
    };
    this.secidfilter = this.dataSource.filterPredicate;
  }
 
  applyFilter(event: any, col?:string) {
    console.log('event',event);
    this.dataSource.filterPredicate = col === undefined? this.defaultFilterPredicate : this.secidfilter
    const filterValue = event.hasOwnProperty('isUserInput')?  event.source.value :  (event.target as HTMLInputElement).value 
    !event.hasOwnProperty('isUserInput') || event.isUserInput ? this.dataSource.filter = filterValue.trim().toLowerCase() : null;
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
    ( this.marketSource.value != null&&this.marketSource.value.length !=0)? Object.assign (searchObj , {'sourcecode': this.marketSource.value}): null;
    ( this.boards.value != null&&this.boards.value.length !=0)? Object.assign (searchObj , {'boardid': this.boards.value}): null;
    this.MarketDataService.getMoexInstruments(10000,this.FormMode==='ChartMode'? 'secid ASC':undefined,searchObj).subscribe (marketData  => {
      this.dataSource  = new MatTableDataSource(marketData);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.instruments.unshift('ClearAll')
      resolve(marketData) 
    })
  })
  }
  toggleAllSelection() {
   
  }
  exportToExcel() {
    const fileName = "instrumentData.xlsx";
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.dataSource.data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "instrumentData");
    XLSX.writeFile(wb, fileName);
  }
  get  marketSource () {return this.searchParametersFG.get('marketSource') } 
  get  boards () {return this.searchParametersFG.get('boards') } 
  get  secidList () {return this.searchParametersFG.get('secidList') } 
  
  
}