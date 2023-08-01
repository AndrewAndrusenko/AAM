import {AfterViewInit, Component, ViewEncapsulation, EventEmitter, Output, ViewChild, Input, ChangeDetectionStrategy, ElementRef} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {Observable, Subscription } from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {animate, state, style, transition, trigger} from '@angular/animations';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { Instruments, instrumentCorpActions, instrumentDetails, marketDataSources, trades } from 'src/app/models/intefaces.model';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {MatChipInputEvent} from '@angular/material/chips';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { menuColorGl, investmentNodeColorChild, additionalLightGreen } from 'src/app/models/constants.model';
import { indexDBService } from 'src/app/services/indexDB.service';
import { formatNumber } from '@angular/common';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { HandlingCommonTasksService } from 'src/app/services/handling-common-tasks.service';
import { AuthService } from 'src/app/services/auth.service';
import { AppTradeService } from 'src/app/services/trades-service.service';
import { AppTradeModifyFormComponent } from '../../forms/trade-form.component/trade-form.component';
@Component({
  selector: 'app-trade-table',
  
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './trade-table.component.html',
  styleUrls: ['./trade-table.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class AppTradeTableComponent  implements AfterViewInit {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  @Input() FormMode:string
  columnsToDisplay = ['idtrade','tdate','trtype','tidinstrument','price','id_price_currency','qty','cpty','vdate','id_settlement_currency','tidorder','allocatedqty','action'];
  columnsHeaderToDisplay = ['ID','Date','Type','SecID','Price','Currency','Quantity','CParty','ValueDate','Settlement','Order','Allocated','Action'
  ];
  dataSource: MatTableDataSource<trades>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('filterALL', { static: false }) filterALL: ElementRef;

  @Output() public modal_principal_parent = new EventEmitter();
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  panelOpenStateSecond = false;
  accessToClientData: string = 'true';
  instruments: string[] = ['ClearAll'];
  investmentNodeColor = investmentNodeColorChild;
  additionalLightGreen = additionalLightGreen;
  filterednstrumentsLists : Observable<string[]>;
  menuColorGl=menuColorGl;
  searchParametersFG: FormGroup;

  dialogTradeModify: MatDialogRef<AppTradeModifyFormComponent>;

  defaultFilterPredicate?: (data: any, filter: string) => boolean;
  secidfilter?: (data: any, filter: string) => boolean;
  constructor(
    private TradeService: AppTradeService,
    private AuthServiceS:AuthService,  
    private HandlingCommonTasksS:HandlingCommonTasksService,
    private CommonDialogsService:HadlingCommonDialogsService,
    private dialog: MatDialog,
    private fb:FormBuilder, 
  ) {
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToTradesData')[0].elementvalue;
    this.disabledControlElements = this.accessState === 'full'? false : true;
    this.searchParametersFG = this.fb.group ({
      secidList: null,
      amount:{value:null, disabled:true},
      marketSource : {value:null, disabled:false},
      boards : {value:null, disabled:false}
    });
   
     this.TradeService.getTradeDataToUpdateTableSource().subscribe(data =>{
     let index =  this.dataSource.data.findIndex(elem=>elem.idtrade===data.data[0].idtrade)
      switch (data.action) {
        case 'Deleted':
          this.dataSource.data.splice(index,1)
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
  }
  openTradeModifyForm (action:string, element:any) {
    this.dialogTradeModify = this.dialog.open (AppTradeModifyFormComponent,{minHeight:'600px', minWidth:'40vw', autoFocus: false, maxHeight: '90vh'})
    this.dialogTradeModify.componentInstance.action = action;
    this.dialogTradeModify.componentInstance.data = action ==='Create'? null :element;
  }
  async ngAfterViewInit() {
    this.TradeService.getTradeInformation().subscribe (tradesData => this.updateTradesDataTable(tradesData))  

  }
  updateTradesDataTable (tradesData:trades[]) {
    this.dataSource  = new MatTableDataSource(tradesData);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.defaultFilterPredicate = this.dataSource.filterPredicate;
    this.dataSource.filterPredicate = function(data, filter: string): boolean {return data.tidinstrument.toLowerCase().includes(filter)};
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
    (index >= 0)? this.instruments.splice(index, 1) : null;
  }
  clearAll(event) {event.target.textContent.trim() === 'ClearAll cancel'? this.instruments = ['ClearAll']: null}
  addChips (el: any, column: string) {(['accountNo'].includes(column))? this.instruments.push(el):null;}
  updateFilter (el: any) {
    this.filterALL.nativeElement.value = el;
    this.dataSource.filter = el.trim();
    (this.dataSource.paginator)? this.dataSource.paginator.firstPage() : null;
  }
  clearFilter (input:HTMLInputElement) {
    input.value=''
    this.dataSource.filter = ''
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage()}
  }
  async submitQuery () {
    return new Promise((resolve, reject) => {
      this.dataSource.data? this.dataSource.data = null : null;
      let searchObj = {};
      let instrumentsList = [];
      this.instruments.indexOf('ClearAll') !== -1? this.instruments.splice(this.instruments.indexOf('ClearAll'),1) : null;
      this.instruments.length===1? instrumentsList = [...this.instruments,...this.instruments]: instrumentsList = this.instruments;
      this.instruments.length? Object.assign (searchObj , {'secid': instrumentsList}): null;
      /* this.marketSource.value != null&&this.marketSource.value.length !=0? Object.assign (searchObj , {'sourcecode': this.marketSource.value}): null;
      this.boards.value != null&&this.boards.value.length !=0? Object.assign (searchObj , {'boardid': this.boards.value}): null; */
      this.TradeService.getTradeInformation().subscribe(data => {
        this.dataSource  = new MatTableDataSource(data);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.instruments.unshift('ClearAll')
        this.CommonDialogsService.snackResultHandler({name:'success',detail: formatNumber (data.length,'en-US') + ' rows'}, 'Loaded ');
        resolve(data) 
      });
    });
  }
  toggleAllSelection(elem:string, allSelected: boolean) {
/*     allSelected? this.searchParametersFG.get(elem).patchValue(
      elem==='marketSource'? [...this.marketSources.map(item => item.segments.map(el => el.sourceCode)),0].flat() : [...this.boardIDs.map(item => item.boardid
    ), 0]) : this.searchParametersFG.get(elem).patchValue([]); */
  }

  selectInstrument (element:Instruments) {this.modal_principal_parent.emit(element)}
  exportToExcel() {this.HandlingCommonTasksS.exportToExcel (this.dataSource.data,"tradesData")  }
  get  marketSource () {return this.searchParametersFG.get('marketSource') } 
  get  boards () {return this.searchParametersFG.get('boards') } 
  get  secidList () {return this.searchParametersFG.get('secidList') } 
}