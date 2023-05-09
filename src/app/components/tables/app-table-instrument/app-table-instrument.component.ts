import {AfterViewInit, Component, ViewEncapsulation, EventEmitter, Output, ViewChild, Input} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {Observable, Subscription } from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {animate, state, style, transition, trigger} from '@angular/animations';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { Instruments, instrumentCorpActions, instrumentDetails, marketDataSources } from 'src/app/models/accounts-table-model';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {MatChipInputEvent} from '@angular/material/chips';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import * as XLSX from 'xlsx'
import { AppMarketDataService } from 'src/app/services/app-market-data.service';
import { menuColorGl,investmentNodeColor, investmentNodeColorChild, additionalLightGreen } from 'src/app/models/constants';
import { AppInvInstrumentModifyFormComponent } from '../../forms/app-inv-instrument-modify-form/app-inv-instrument-modify-form';
import { TreeMenuSevice } from 'src/app/services/tree-menu.service';
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
export class AppInstrumentTableComponent  implements AfterViewInit {
  @Input() FormMode:string
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
    'action'
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
    'action'
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
  instrumentDetailsArr:instrumentDetails[] = [];
  instrumentCorpActions:instrumentCorpActions[] = [];
  accessToClientData: string = 'true';
  instruments: string[] = ['ClearAll'];
  investmentNodeColor = investmentNodeColorChild;
  additionalLightGreen = additionalLightGreen;
  public filterednstrumentsLists : Observable<string[]>;
  
  boardIDs =[]
  searchParametersFG: FormGroup;
  filterlFormControl = new FormControl('');
  filterlAllFormControl = new FormControl('');
  boardsOne = new FormControl('');

  dialogInstrumentModify: MatDialogRef<AppInvInstrumentModifyFormComponent>;

  defaultFilterPredicate?: (data: any, filter: string) => boolean;
  secidfilter?: (data: any, filter: string) => boolean;
  constructor(
    private MarketDataService: AppMarketDataService,
    private TreeMenuSevice:TreeMenuSevice,
    private dialog: MatDialog,
    private fb:FormBuilder, 
  ) {
    this.MarketDataService.getInstrumentDataGeneral('getBoardsDataFromInstruments').subscribe(boardsData => this.boardIDs=boardsData)
    this.MarketDataService.getMarketDataSources().subscribe(marketSourcesData => this.marketSources = marketSourcesData);
   
    this.MarketDataService.getInstrumentData().subscribe(data =>{
     let index =  this.dataSource.data.findIndex(elem=>elem.id===data.data[0].id)
      switch (data.action) {
        case 'Deleted':
          // console.log('index del', index, this.dataSource.data.length);
          this.dataSource.data.splice(index,1)
          // console.log('da del',  this.dataSource.data.length, this.dataSource.data);
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
    })
    this.searchParametersFG = this.fb.group ({
      secidList: null,
      amount:{value:null, disabled:true},
      marketSource : {value:null, disabled:false},
      boards : {value:null, disabled:false}
    });
  }
  openInstrumentModifyForm (action:string, element:any) {
    this.dialogInstrumentModify = this.dialog.open (AppInvInstrumentModifyFormComponent,{minHeight:'600px', minWidth:'1300px', autoFocus: false, maxHeight: '90vh'})
    this.dialogInstrumentModify.componentInstance.moexBoards = this.boardIDs;
    this.dialogInstrumentModify.componentInstance.action = action;
    this.dialogInstrumentModify.componentInstance.data = element;
    this.dialogInstrumentModify.componentInstance.instrumentDetails = this.instrumentDetailsArr.filter(el=> el.secid===element.secid&&element.primary_boardid===el.boardid)
    this.dialogInstrumentModify.componentInstance.instrumentCorpActions = this.instrumentCorpActions.filter(el=> el.isin===element.isin)
  }
  async ngAfterViewInit() {
    console.log('formMode',this.FormMode);
    if (this.FormMode==='Redis') {
      console.log('getRedisMoexInstruments');
      this.MarketDataService.getRedisMoexInstruments().subscribe((data)=>this.updateInstrumentDataTable(data))   
    } else {
      this.MarketDataService.getMoexInstruments().subscribe (instrumentData => this.updateInstrumentDataTable(instrumentData))  
    }
    this.MarketDataService.getInstrumentDataDetails().subscribe(instrumentDetails => {
      this.instrumentDetailsArr = instrumentDetails
    })
    this.MarketDataService.getInstrumentDataCorpActions().subscribe(instrumentCorpActions => {
      this.instrumentCorpActions = instrumentCorpActions
    })
  }
  handleNewFavoriteClick(elem:Instruments){
    console.log('elem',elem);
    let userData = JSON.parse(localStorage.getItem('userInfo'))
    this.TreeMenuSevice.addItemToFavorites (elem.secid , 'Instruments', userData.user.id, elem.id.toString())
    .then((response) => { console.log('Added to Favorites')})
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
    this.filterlAllFormControl.patchValue(el);
    this.dataSource.filter = el.trim();
    (this.dataSource.paginator)? this.dataSource.paginator.firstPage() : null;
  }
  clearFilter (fFormControl : FormControl) {
    fFormControl.patchValue('')
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