import {ChangeDetectionStrategy, Component, EventEmitter, OnDestroy, OnInit, Output, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {Subject, Subscription, takeUntil } from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {animate, state, style, transition, trigger} from '@angular/animations';
import { bAccountsEntriesList, SWIFTSGlobalListmodel } from 'Frontend-Angular-Src/app/models/accountng-intefaces.model';
import { AppAccountingService } from 'Frontend-Angular-Src/app/services/accounting.service';
import { SelectionModel } from '@angular/cdk/collections';
import { HandlingTableSelectionService } from 'Frontend-Angular-Src/app/services/handling-table-selection.service';
import { AppTableSWIFT950ItemsComponent } from '../swift-950-table.component/swift-items-table.component';
import { HandlingEntryProcessingService } from 'Frontend-Angular-Src/app/services/handling-entry-processing.service';
import { LogProcessingService } from 'Frontend-Angular-Src/app/services/log-processing.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HandlingCommonTasksService } from 'Frontend-Angular-Src/app/services/handling-common-tasks.service';
import { HadlingCommonDialogsService } from 'Frontend-Angular-Src/app/services/hadling-common-dialogs.service';
import { formatDate, formatNumber } from '@angular/common';
import { AuthService } from 'Frontend-Angular-Src/app/services/auth.service';
import { MatCalendarCellClassFunction } from '@angular/material/datepicker';
import { cFormValidationLog } from 'Frontend-Angular-Src/app/models/interfaces.model';
@Component({
  selector: 'app-swifts-incoming-table',
  templateUrl: './swifts-incoming-table.component.html',
  styleUrls: ['./swifts-incoming-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class AppTableSWIFTsInListsComponent  implements OnInit,OnDestroy {
  private subs = new Subscription();
  accessState: string = 'none';
  accessToEntriesData: string = 'none';
  disabledControlElements: boolean = false;
  columnsToDisplay = ['select','id','msgId',  'senderBIC', 'DateMsg', 'typeMsg','accountNo', 'ledgerNo'];
  columnsHeaderToDisplay = ['id','msgId',  'senderBIC', 'Date', 'Type','Account','ledger'];
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
  dateWithSWIFTs : Date[]

  selection = new SelectionModel<SWIFTSGlobalListmodel>(true, []);
  multiSelect: boolean = true; 
  overRideOverdraft: boolean = false;
  errorLogAutoProcessingALL :cFormValidationLog[] = []
  createdLogAutoProcessingALL: bAccountsEntriesList []=[]
  transactionsToProcess = []
  swiftProcessingFB: FormGroup
  errorLog$ : Subscription;
  createdLog$ : Subscription;
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
    this.swiftProcessingFB = this.fb.group ({
      cDateToProcessSwift :[null, [Validators.required]],
      cDateAccounting : [null, [Validators.required]],
      overRideOverdraft: {value:false}
    });
  }
  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.closeLogSubscriptions();
  }
  ngOnInit(): void { 
    this.accessToEntriesData = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToEntriesData')[0].elementvalue;
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToSWIFTData')[0].elementvalue;
    this.disabledControlElements = this.accessState === 'full'? false : true;
    this.AccountingDataService.GetbParamsgfirstOpenedDate('GetbParamsgfirstOpenedDate').subscribe(data=>{
      this.FirstOpenedAccountingDate = data[0].FirstOpenedDate;
      this.cDateToProcessSwift.setValue(new Date(this.FirstOpenedAccountingDate))
      this.cDateAccounting.setValue(new Date(this.FirstOpenedAccountingDate))
      this.cDateToProcessSwift.setValue(new Date())
      this.cDateAccounting.setValue(new Date())
    });
    this.subs.add(this.AccountingDataService.GetSWIFTsList (null,null,null,null,'DatesWithSWIFT').subscribe(dates=>{
      this.dateWithSWIFTs = dates[0]['datesarray'];
    }))
  }
  updateSwiftsData (action: string, dateMessage?:string,snack:boolean=false) {
    this.subs.add (this.accessState === 'none'? null : this.AccountingDataService.GetSWIFTsList (dateMessage,null,null,null,action).subscribe (SWIFTsList  => {
      snack? this.CommonDialogsService.snackResultHandler({name:'success',detail: formatNumber (SWIFTsList.length,'en-US') + ' rows'},'Loaded '):null;
      this.dataSource? this.dataSource.data = null : null;
      this.dataSource  = new MatTableDataSource(SWIFTsList);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }))
  }
  clearLogs () {
    this.errorLogAutoProcessingALL = [];
    this.createdLogAutoProcessingALL =[];
    this.transactionsToProcess = [];
  }
  closeLogSubscriptions () {
    this.errorLog$.unsubscribe();
    this.createdLog$.unsubscribe();
  }
  openLogSubscritions () {
   this.errorLog$ = null;
   this.createdLog$ = null;
   this.errorLog$ = this.LogService.getLogObject().pipe().subscribe(logObject => {
      logObject.forEach (logObj => {
        let index = this.transactionsToProcess.findIndex(elem => elem.id===logObj.t_extTransactionId);
        this.transactionsToProcess[index].status ='Error';
        this.errorLogAutoProcessingALL.filter((fullLog) => fullLog.errorCode === logObj.errorCode).length === 0? this.errorLogAutoProcessingALL.push (logObj):null; 
        this.isProcessingComplete();
      })
    })
    this.createdLog$ = this.LogService.geCreatedtLogObject().pipe().subscribe(logCreatedObject => {
      let index = this.transactionsToProcess.findIndex(elem => elem.id===logCreatedObject.t_extTransactionId);
      this.transactionsToProcess[index].status ='Created';
      this.createdLogAutoProcessingALL.push(logCreatedObject);
      this.isProcessingComplete();
    })
  }
  ProcessSwiftStatemts (overdraftOverride:boolean, autoProcessing:boolean) {
    autoProcessing? this.swiftProcessingFB.disable() : null;
    this.clearLogs();
    this.openLogSubscritions();
    this.TableSwiftItems.forEach(swiftTable => {
      swiftTable.selection.selected.forEach(element => {
        if (['CR','DR'].includes(element.typeTransaction)&&(Number(element.entriesAmount)===0)) {
          element['status'] = undefined;
          this.EntryProcessingService.openEntry(element, swiftTable.parentMsgRow, autoProcessing, this.cDateAccounting.value, overdraftOverride);
          autoProcessing? this.transactionsToProcess.push(element) : null;
        }
      });      
      swiftTable.selection.clear();
    })
    if (!this.transactionsToProcess.length) {
      this.swiftProcessingFB.enable();
      autoProcessing? this.CommonDialogsService.snackResultHandler({name:'error', detail:'All transaction are allocated. No entries have been created'}) : null;
    }
  }
  isProcessingComplete():boolean {
    this.transactionsCreated = this.transactionsToProcess.filter(elem => elem.status ==='Created').length; 
    this.transactionsWithErrors = this.transactionsToProcess.filter(elem => elem.status ==='Error').length;
    console.log('Trans: ', this.transactionsToProcess.length ,'Err: ', this.transactionsWithErrors,'Cre: ', this.transactionsCreated)
    if (this.transactionsToProcess.length  === (this.transactionsWithErrors + this.transactionsCreated)) {
      this.swiftProcessingFB.enable();
      this.AccountingDataService.sendLoadedMT950Transactions (this.transactionsToProcess.filter(elem => elem.status ==='Created').map(el=>el.msgId));     
      this.closeLogSubscriptions();   
    };
    return this.transactionsToProcess.length  === (this.transactionsWithErrors + this.transactionsCreated);
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    this.dataSource.paginator? this.dataSource.paginator.firstPage() : null;
  }
  clearFilter (input: HTMLInputElement) {
    input.value='';
    this.dataSource.filter = '';
    this.dataSource.paginator? this.dataSource.paginator.firstPage() : null;
  }
  toggleParentandChild (row:SWIFTSGlobalListmodel, rowIndex: number) {
    this.selection.toggle(row);
    let TableSwiftItem = this.TableSwiftItems.filter((e, index) => index === rowIndex);
    TableSwiftItem[0].toggleAllRows();
  }
  isAllClidrenSelected(rowIndex: number) {
    let TableSwiftItem = this.TableSwiftItems.filter((e, index) => index === rowIndex);
    return TableSwiftItem.length?  TableSwiftItem[0].isAllSelected() : false;
  }
  ChildhasValue (rowIndex: number) {
    let TableSwiftItem = this.TableSwiftItems.filter((e, index) => index === rowIndex);
    return TableSwiftItem.length? TableSwiftItem[0].selection.hasValue() : false;
  }
  isAllSelected() {return this.SelectionService.isAllSelected(this.dataSource, this.selection)} 
  toggleAllRows(selectAll:boolean) {
    this.TableSwiftItems.forEach(tableSwift => {tableSwift.toggleAllRows(selectAll? true : false)});
    return this.SelectionService.toggleAllRows(this.dataSource, this.selection);
  } 
  checkboxLabel(row?: SWIFTSGlobalListmodel): string {return this.SelectionService.checkboxLabel(this.dataSource, this.selection, row)}
  changeProcesDate () {
    this.cDateAccounting.setValue(this.cDateToProcessSwift.value>=new Date(this.FirstOpenedAccountingDate)? this.cDateToProcessSwift.value : this.FirstOpenedAccountingDate)
    if (this.cDateToProcessSwift.valid) {
      this.updateSwiftsData('GetSWIFTsList',formatDate(this.cDateToProcessSwift.value,'yyyy-MM-dd','en'));
      this.clearLogs ();
    }
  }
  submitQuery () {
    this.cDateAccounting.patchValue(null);
    this.cDateToProcessSwift.patchValue(null);
    this.updateSwiftsData('GetSWIFTsList',undefined,true)
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