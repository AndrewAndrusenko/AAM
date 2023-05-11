import {AfterViewInit, Component, EventEmitter, OnDestroy, OnInit, Output, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {lastValueFrom, Subscription } from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {TreeMenuSevice } from 'src/app/services/tree-menu.service';
import { bAccountsEntriesList, cFormValidationLog, SWIFTSGlobalListmodel } from 'src/app/models/intefaces';
import { AppAccountingService } from 'src/app/services/app-accounting.service';
import { SelectionModel } from '@angular/cdk/collections';
import { HandlingTableSelectionService } from 'src/app/services/handling-table-selection.service';
import { AppTableSWIFT950ItemsComponent } from '../swift-950-table/swift-950-table';
import { HandlingEntryProcessingService } from 'src/app/services/handling-entry-processing.service';
import { LogProcessingService } from 'src/app/services/log-processing.service';
import { FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
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
  columnsToDisplay = ['select','msgId',  'senderBIC', 'DateMsg', 'typeMsg','accountNo', 'ledgerNo'];
  columnsHeaderToDisplay = ['msgId',  'senderBIC', 'Date', 'Type','Account','ledger'];
  columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
  dataSource: MatTableDataSource<SWIFTSGlobalListmodel>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChildren (AppTableSWIFT950ItemsComponent) TableSwiftItems: QueryList<AppTableSWIFT950ItemsComponent>;

  @Output() public modal_principal_parent = new EventEmitter();
  expandedElement: SWIFTSGlobalListmodel  | null;
  accessToClientData: string = 'true';
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
  constructor (
    private AccountingDataService:AppAccountingService, 
    private TreeMenuSevice:TreeMenuSevice,  
    private SelectionService:HandlingTableSelectionService,
    private EntryProcessingService:HandlingEntryProcessingService,
    private LogService:LogProcessingService,
    private fb : FormBuilder

  ) {
    this.AccountingDataService.GetbLastClosedAccountingDate(null,null,null,null,'GetbLastClosedAccountingDate').subscribe(data=>{
      this.FirstOpenedAccountingDate = data[0].FirstOpenedDate
    })
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
      console.log('st',this.transactionsToProcess);

    })
    this.swiftProcessingFB = this.fb.group ({
      cDateToProcessSwift:[null, [Validators.required]],
      cDateAccounting : [null, [Validators.required]],
      overRideOverdraft: {value:false}
    } )
  }
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.subscriptionCreatedLog.unsubscribe();
  }
  ngOnInit(): void {
  
  }
  async ProcessSwiftStatemts (overdraftOverride:boolean) {
    this.swiftProcessingFB.disable();
    this.errorLogAutoProcessingALL = [];
    this.createdLogAutoProcessingALL = [];
    this.transactionsToProcess = [];
    this.TableSwiftItems.forEach(swiftTable => {
      swiftTable.selection.selected.forEach(element => {
        if (['CR','DR'].includes(element.typeTransaction)&&(Number(element.entriesAmount)===0)) {
         this.EntryProcessingService.openEntry(element, swiftTable.parentMsgRow, true, this.cDateAccounting.value, overdraftOverride);
         this.transactionsToProcess.push(element) 
        }
      });
      swiftTable.selection.clear();
      
    })
  }

  async ngAfterViewInit() {
    this.columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
    let userData = JSON.parse(localStorage.getItem('userInfo'))
    await lastValueFrom (this.TreeMenuSevice.getaccessRestriction (userData.user.accessrole, 'accessToClientData'))
    .then ((accessRestrictionData) =>{
      this.accessToClientData = accessRestrictionData['elementvalue']
      this.AccountingDataService.GetSWIFTsList (null,null,null,null,'GetSWIFTsList').subscribe (SWIFTsList  => {
        this.dataSource  = new MatTableDataSource(SWIFTsList);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.cDateToProcessSwift.setValue(new Date(this.FirstOpenedAccountingDate))
        this.cDateAccounting.setValue(new Date(this.FirstOpenedAccountingDate))
      })
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
    this.AccountingDataService.GetSWIFTsList (new Date(dateToProcess).toDateString(),null,null,null,'GetSWIFTsList').subscribe (SWIFTsList  => {
      this.dataSource  = new MatTableDataSource(SWIFTsList);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    })

  }
  get cDateAccounting () {return this.swiftProcessingFB.get('cDateAccounting')}
  get cDateToProcessSwift () {return this.swiftProcessingFB.get('cDateToProcessSwift')}

}