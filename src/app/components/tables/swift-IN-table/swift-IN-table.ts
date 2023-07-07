import {AfterViewInit, Component, EventEmitter, OnDestroy, OnInit, Output, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {Subscription } from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {animate, state, style, transition, trigger} from '@angular/animations';
import { bAccountsEntriesList, cFormValidationLog, SWIFTSGlobalListmodel } from 'src/app/models/intefaces';
import { AppAccountingService } from 'src/app/services/app-accounting.service';
import { SelectionModel } from '@angular/cdk/collections';
import { HandlingTableSelectionService } from 'src/app/services/handling-table-selection.service';
import { AppTableSWIFT950ItemsComponent } from '../swift-950-table/swift-950-table';
import { HandlingEntryProcessingService } from 'src/app/services/handling-entry-processing.service';
import { LogProcessingService } from 'src/app/services/log-processing.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HandlingCommonTasksService } from 'src/app/services/handling-common-tasks.service';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { formatDate, formatNumber } from '@angular/common';
import { AuthService } from 'src/app/services/auth.service';
import { MatCalendarCellClassFunction } from '@angular/material/datepicker';
@Component({
  selector: 'app-table-swift-IN-list',
  templateUrl: './swift-IN-table.html',
  styleUrls: ['./swift-IN-table.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class AppTableSWIFTsInListsComponent  implements  AfterViewInit, OnInit,OnDestroy {
  accessState: string = 'none';
  accessToEntriesData: string = 'none';
  disabledControlElements: boolean = false;
  columnsToDisplay = ['select','msgId',  'senderBIC', 'DateMsg', 'typeMsg','accountNo', 'ledgerNo'];
  columnsHeaderToDisplay = ['msgId',  'senderBIC', 'Date', 'Type','Account','ledger'];
  columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
  dataSource: MatTableDataSource<SWIFTSGlobalListmodel>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChildren (AppTableSWIFT950ItemsComponent) TableSwiftItems: QueryList<AppTableSWIFT950ItemsComponent>;

  @Output() public modal_principal_parent = new EventEmitter();
  expandedElement: SWIFTSGlobalListmodel  | null;
  action: string ='';
  panelOpenState:boolean = false;
  errorsPpanelOpenState:boolean = false;
  createLogPanelOpenState:boolean = false;
  statusLogPanelOpenState: boolean = false;
  transactionsCreated: number = 0;
  transactionsWithErrors: number = 0;
  
  FirstOpenedAccountingDate: Date;

  selection = new SelectionModel<SWIFTSGlobalListmodel>(true, []);
  public multiSelect: boolean = true; 
  overRideOverdraft: boolean = false;
  subscription: Subscription;
  subscriptionCreatedLog: Subscription;
  errorLogAutoProcessingALL :cFormValidationLog[] = []
  createdLogAutoProcessingALL: bAccountsEntriesList []=[]
  transactionsToProcess = []
  swiftProcessingFB: FormGroup
  dateWithSWIFTs : Date[]

  constructor (
    private AccountingDataService:AppAccountingService, 
    private AuthServiceS:AuthService,  
    private SelectionService:HandlingTableSelectionService,
    private EntryProcessingService:HandlingEntryProcessingService,
    private CommonDialogsService:HadlingCommonDialogsService,
    private HandlingCommonTasksS:HandlingCommonTasksService,
    private LogService:LogProcessingService,
    private fb : FormBuilder

  ) {
    this.accessToEntriesData = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToEntriesData')[0].elementvalue;
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToSWIFTData')[0].elementvalue;
    this.disabledControlElements = this.accessState === 'full'? false : true;
    this.AccountingDataService.GetbLastClosedAccountingDate(null,null,null,null,'GetbLastClosedAccountingDate').subscribe(data=>{
      this.FirstOpenedAccountingDate = data[0].FirstOpenedDate
      this.cDateToProcessSwift.setValue(new Date(this.FirstOpenedAccountingDate))
      this.cDateAccounting.setValue(new Date(this.FirstOpenedAccountingDate))
    })
    this.AccountingDataService.GetSWIFTsList (null,null,null,null,'DatesWithSWIFT').subscribe(dates=>this.dateWithSWIFTs = dates[0]['datesarray']);
    this.subscription = this.LogService.getLogObject().subscribe(logObject => {
      logObject.forEach (logObj => {
        let index = this.transactionsToProcess.findIndex(elem => elem.id===logObj.t_extTransactionId)
        this.transactionsToProcess[index].status ='Error';
        this.errorLogAutoProcessingALL.filter((fullLog) => fullLog.errorCode === logObj.errorCode).length === 0? this.errorLogAutoProcessingALL.push (logObj):null; 
        this.isProcessingComplete()? this.swiftProcessingFB.enable() : null ;
        
      })
      console.log('st',this.transactionsToProcess);
    })
    this.subscriptionCreatedLog = this.LogService.geCreatedtLogObject().subscribe(logCreatedObject => {
      console.log('geCreatedtLogObject',logCreatedObject, this.createdLogAutoProcessingALL);
      let index = this.transactionsToProcess.findIndex(elem => elem.id===logCreatedObject.t_extTransactionId)
      this.transactionsToProcess[index].status ='Created'
      this.createdLogAutoProcessingALL.push(logCreatedObject);
      this.isProcessingComplete()? this.swiftProcessingFB.enable() : null ;
    })
    this.swiftProcessingFB = this.fb.group ({
      cDateToProcessSwift :[null, [Validators.required]],
      cDateAccounting : [null, [Validators.required]],
      overRideOverdraft: {value:false}
    } )
  }
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.subscriptionCreatedLog.unsubscribe();
  }
  ngOnInit(): void {
    this.swiftProcessingFB.enable()
  }
  ngAfterViewInit() {
    // this.updateSwiftsData('GetSWIFTsList');

  }
  async updateSwiftsData (action: string, dateMessage?:string) {
    console.log('updateSwiftsData');
    return new Promise<number> (async (resolve,reject) => {
      this.accessState === 'none'? null : this.AccountingDataService.GetSWIFTsList (dateMessage,null,null,null,action).subscribe (SWIFTsList  => {
        console.log('GetSWIFTsList sub',SWIFTsList);
        this.dataSource? this.dataSource.data = null : null;
        this.dataSource  = new MatTableDataSource(SWIFTsList);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        resolve(SWIFTsList.length)
    })
  })
  }
  async ProcessSwiftStatemts (overdraftOverride:boolean) {
    this.swiftProcessingFB.disable();
    this.errorLogAutoProcessingALL = [];
    this.createdLogAutoProcessingALL = [];
    this.transactionsToProcess = [];
    this.TableSwiftItems.forEach(swiftTable => {
      swiftTable.selection.selected.forEach(element => {
        console.log('element.typeTransaction)&&(Number(element.entriesAmount', (['CR','DR'].includes(element.typeTransaction)&&(Number(element.entriesAmount)===0)), element.typeTransaction,Number(element.entriesAmount))
        if (['CR','DR'].includes(element.typeTransaction)&&(Number(element.entriesAmount)===0)) {
         this.EntryProcessingService.openEntry(element, swiftTable.parentMsgRow, true, this.cDateAccounting.value, overdraftOverride);
         this.transactionsToProcess.push(element) 
        }
      });
      if (!this.transactionsToProcess.length) {
        this.swiftProcessingFB.enable();
        this.CommonDialogsService.snackResultHandler({name:'error', detail:'All transaction are allocated. No entries have been created'});
      }
      swiftTable.selection.clear();
    })
  }
  isProcessingComplete():boolean {
    this.transactionsCreated = this.transactionsToProcess.filter(elem => elem.status ==='Created').length; 
    this.transactionsWithErrors = this.transactionsToProcess.filter(elem => elem.status ==='Error').length;
    console.log(this.transactionsToProcess.length , this.transactionsWithErrors, this.transactionsCreated)
    return this.transactionsToProcess.length  === (this.transactionsWithErrors + this.transactionsCreated)
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage();}
  }
  clearFilter (input: HTMLInputElement) {
    input.value='';
    this.dataSource.filter = '';
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage()}
  }
  toggleParentandChild (row:any, rowIndex: any) {
    this.selection.toggle(row);
    let TableSwiftItem = this.TableSwiftItems.filter((element, index) => index === rowIndex);
    TableSwiftItem[0].toggleAllRows()
  }
  isAllClidrenSelected(row:any, rowIndex: any) {
    let TableSwiftItem = this.TableSwiftItems.filter((element, index) => index === rowIndex);
    return TableSwiftItem.length?  TableSwiftItem[0].isAllSelected() : false
  }
  ChildhasValue (row:any, rowIndex: any) {
    let TableSwiftItem = this.TableSwiftItems.filter((element, index) => index === rowIndex);
    return TableSwiftItem.length? TableSwiftItem[0].selection.hasValue() : false
  }
  isAllSelected() { return this.SelectionService.isAllSelected(this.dataSource, this.selection)} 
  toggleAllRows() {
    this.TableSwiftItems.forEach(tableSwift => {tableSwift.toggleAllRows()})
    return this.SelectionService.toggleAllRows(this.dataSource, this.selection)
  } 
  checkboxLabel(row?: SWIFTSGlobalListmodel): string {return this.SelectionService.checkboxLabel(this.dataSource, this.selection, row)}
  changeProcesDate (dateToProcess) {
    this.cDateAccounting.setValue(this.cDateToProcessSwift.value>=new Date(this.FirstOpenedAccountingDate)? this.cDateToProcessSwift.value : this.FirstOpenedAccountingDate)
    this.cDateToProcessSwift.valid? this.updateSwiftsData('GetSWIFTsList',formatDate(this.cDateToProcessSwift.value,'yyyy-MM-dd','en')) : null;
  }
  async submitQuery () {
    this.updateSwiftsData('GetSWIFTsList').then (rowsCount => {
      this.CommonDialogsService.snackResultHandler({name:'success',detail: formatNumber (rowsCount,'en-US') + ' rows'},'Loaded ')
    })
  }
  dateClass: MatCalendarCellClassFunction<Date> = (cellDate, view) => {
    const index = this.dateWithSWIFTs.findIndex(x => new Date(x).toLocaleDateString() == cellDate['_d'].toLocaleDateString());
    return (index > -1)? 'date-highlighted' : '';
  };
  
  exportToExcel() {
    this.HandlingCommonTasksS.exportToExcel (this.dataSource.data,"SWIFT950")
  }
  get cDateAccounting () {return this.swiftProcessingFB.get('cDateAccounting')}
  get cDateToProcessSwift () {return this.swiftProcessingFB.get('cDateToProcessSwift')}

}