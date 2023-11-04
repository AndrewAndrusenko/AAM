import {Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, SimpleChanges, ViewChild} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {Subscription, filter, tap } from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {animate, state, style, transition, trigger} from '@angular/animations';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { bAccountsEntriesList, bcTransactionType_Ext } from 'src/app/models/intefaces.model';
import { AppAccountingService } from 'src/app/services/accounting.service';
import { AppAccEntryModifyFormComponent } from '../../forms/acc-entry-form.component/acc-entry-form.component';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {MatChipInputEvent} from '@angular/material/chips';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AppTableAccAccountsComponent } from '../acc-accounts-table.component/acc-accounts-table.component';
import { MatOption } from '@angular/material/core';
import { investmentNodeColor, menuColorGl } from 'src/app/models/constants.model';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { formatNumber } from '@angular/common';
import { HandlingCommonTasksService } from 'src/app/services/handling-common-tasks.service';
import { AuthService } from 'src/app/services/auth.service';
import { indexDBService } from 'src/app/services/indexDB.service';
import { TreeMenuSevice } from 'src/app/services/tree-menu.service';
import { AppInvestmentDataServiceService } from 'src/app/services/investment-data.service.service';

@Component({
  selector: 'app-table-acc-entries',
  templateUrl: './acc-entries-table.component.html',
  styleUrls: ['./acc-entries-table.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class AppTableAccEntriesComponent implements OnInit {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  columnsToDisplay = ['t_id','d_portfolioname','d_Debit','d_Credit','t_dataTime','d_xActTypeCodeExtName','t_XactTypeCode','t_amountTransaction','d_entryDetails', 't_idtrade','t_extTransactionId']
  columnsHeaderToDisplay = ['ID','Code','Debit','Credit','Date', 'Code', 'Ledger',  'Amount', 'Details', 'Trade','ExtID', 'Action'];
  columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
  private subscriptions = new Subscription ();
  dataSource: MatTableDataSource<bAccountsEntriesList>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('filter',{static:false}) filter: ElementRef;
  @ViewChild('allSelected') private allSelected: MatOption;
  @Output() public modal_principal_parent = new EventEmitter();
  @Output() newAllocatedSum = new EventEmitter<{swift_item_id:number,allocated_sum:number}>();
  expandedElement: bAccountsEntriesList  | null;
  @Input() UI_min: boolean = false; 
  @Input() action :string;
  @Input() externalId: number = null;
  @Input() FirstOpenedAccountingDate: Date;
  @Input() swiftID: number;
  @Input() swiftItemID: number;
  @Input() paramRowData : any = null;
  dialogRef: MatDialogRef<AppAccEntryModifyFormComponent>;
  filterlFormControl = new FormControl('');
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  dataRange = new FormGroup ({
    dateRangeStart: new FormControl<Date | null>(null),
    dateRangeEnd: new FormControl<Date | null>(null),
  });
  
  panelOpenState = false;
  searchParametersFG: FormGroup;
  dialogChooseAccountsList: MatDialogRef<AppTableAccAccountsComponent>;
  TransactionTypes: bcTransactionType_Ext[] = [];
  filterEntryTypes:string[] = ['ClearAll'];
  investmentNodeColor=investmentNodeColor;
  activeTab:string='';
  tabsNames = ['Transactions List']
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) { 
    if (this.tabsNames.includes(this.activeTab)){
      event.altKey&&event.key==='r'? this.submitQuery(false,true):null;
      event.altKey&&event.key==='w'? this.exportToExcel():null;
    }
  }
  constructor(
    private TreeMenuSevice: TreeMenuSevice,
    private AccountingDataService:AppAccountingService, 
    private CommonDialogsService:HadlingCommonDialogsService,
    private AuthServiceS:AuthService,  
    private HandlingCommonTasksS:HandlingCommonTasksService,
    private dialog: MatDialog,
    private fb:FormBuilder ,
    private indexDBServiceS:indexDBService,
    private InvestmentDataService:AppInvestmentDataServiceService, 


  ) {
    this.searchParametersFG = this.fb.group ({
      dataRange : this.dataRange,
      noAccountLedger: {value:['ClearAll'], disabled:false},
      portfolioCodes: {value:['ClearAll'], disabled:false},
      amount:{value:null, disabled:true},
      entryTypes : {value:[0], disabled:false},
      ExtID:{value:null, disabled:false},
      idtrade:{value:null, disabled:false}
    })
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToEntriesData')[0].elementvalue;
    this.disabledControlElements = this.accessState === 'full'? false : true;
    this.columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
    this.indexDBServiceS.getIndexDBStaticTables('bcTransactionType_Ext').then ( data => this.TransactionTypes = data['data']);
    this.AccountingDataService.getReloadEntryList().pipe(
      filter(id=> id==undefined||(id===this.externalId))
    ).subscribe(id =>{
      this.submitQuery(false,id? true:false)
    })
  }
  ngOnInit(): void {
    this.noAccountLedger.patchValue(['ClearAll'])
    if (!this.FirstOpenedAccountingDate) {
      this.AccountingDataService.GetbParamsgfirstOpenedDate('GetbParamsgfirstOpenedDate').subscribe(data => this.FirstOpenedAccountingDate = data[0].FirstOpenedDate);
    }
    this.initiateTable();
    this.subscriptions.add(this.TreeMenuSevice.getActiveTab().subscribe(tabName=>this.activeTab=tabName));
    this.subscriptions.add(this.InvestmentDataService.getClientsPortfolios().pipe(
      tap(() => this.dataSource? this.dataSource.data = null: null),
      filter(portfolios=>portfolios.length>0)
    ).subscribe(portfolios=> {
      this.portfolioCodes.patchValue(['ClearAll',...portfolios.map(el=>el.code)]);
      this.submitQuery(false)
    }))
  }
  initiateTable() {
    switch (this.action) {
      case 'ShowEntriesForBalanceSheet':
        this.noAccountLedger.value.push(this.paramRowData.accountNo);
        this.dataRange.controls['dateRangeStart'].setValue(new Date (this.paramRowData.dateBalance))
        this.dataRange.controls['dateRangeEnd'].setValue(new Date (this.paramRowData.dateBalance))
        this.submitQuery(false);
      break;
      case 'ViewEntriesByIdTrade':
        this.idtrade.setValue(this.paramRowData.idtrade)
        this.submitQuery(false);
      break;
      case 'ViewEntriesByExternalId':
        this.ExtId.setValue(this.externalId)
        this.submitQuery(false);
      break;
      case 'ViewEntriesByPortfolio':
        this.portfolioCodes.patchValue([this.paramRowData.portfolioCode,this.paramRowData.portfolioCode])
        this.submitQuery(false);
      break;
      case 'None':
      break;
      default :
        this.submitQuery(false)
      break;
    }
  }
  ngOnChanges(changes: SimpleChanges): void {
    changes['paramRowData']?.currentValue!==undefined? this.initiateTable() : null;
  }
  submitQuery (notification:boolean=true, sendNewAllocatedSum:boolean=false) {
    this.AccountingDataService.GetbParamsgfirstOpenedDate('GetbParamsgfirstOpenedDate').subscribe(data => this.FirstOpenedAccountingDate = data[0].FirstOpenedDate);
    let searchObj = this.searchParametersFG.value;
    this.dataSource? this.dataSource.data = null: null;
    Object.assign (searchObj , {'dateRangeStart':
      this.gRange.get('dateRangeStart').value===null? null:new Date (this.gRange.get('dateRangeStart').value).toLocaleDateString()});
    Object.assign (searchObj , {'dateRangeEnd': 
      this.gRange.get('dateRangeEnd').value===null? null : new Date (this.gRange.get('dateRangeEnd').value).toLocaleDateString()});
    Object.assign (searchObj , {'entryTypes': [0,...this.entryTypes.value] });
    this.AccountingDataService.GetAccountsEntriesListAccounting(searchObj,null,null, null, 'GetAccountsEntriesListAccounting').subscribe (EntriesList  => {
      this.dataSource  = new MatTableDataSource(EntriesList);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      notification? this.CommonDialogsService.snackResultHandler({name:'success',detail: formatNumber (EntriesList.length,'en-US') + ' rows'},'Loaded '):null;
      this.externalId&&sendNewAllocatedSum? this.newAllocatedSum.emit({swift_item_id:this.externalId, allocated_sum: this.dataSource.data.reduce((acc,value)=>acc+value.t_amountTransaction,0)}) : null;
    })
  }
  openEntryModifyForm (actionType:string, row: any ) {
    this.dialogRef = this.dialog.open(AppAccEntryModifyFormComponent ,{minHeight:'400px', maxWidth:'1000px',data:{data:row} });
    this.dialogRef.componentInstance.action = actionType;
    this.dialogRef.componentInstance.swiftID=this.swiftID;
    this.dialogRef.componentInstance.data =  row;
    this.dialogRef.componentInstance.FirstOpenedAccountingDate = this.FirstOpenedAccountingDate;
    switch (actionType) {
      case 'Create':
        this.dialogRef.componentInstance.data = {t_XactTypeCode:1, d_transactionType:'AL'};
      break;
      case 'CreateLL':
        this.dialogRef.componentInstance.action = 'Create';
        this.dialogRef.componentInstance.data = {t_XactTypeCode:0, d_transactionType:'LL'} 
      break;
      case 'View':
        this.dialogRef.componentInstance.entryModifyForm.disable()
      break;
    }
  }
  selectAccounts (typeAccount: string) {
    this.dialogChooseAccountsList = this.dialog.open(AppTableAccAccountsComponent ,{minHeight:'600px', minWidth:'1700px', autoFocus: false, maxHeight: '90vh'});
    this.dialogChooseAccountsList.componentInstance.action = "GetALLAccountsDataWholeList";
    this.dialogChooseAccountsList.componentInstance.readOnly = true;
    this.dialogChooseAccountsList.componentInstance.multiSelect = true;
    this.dialogChooseAccountsList.componentInstance.modal_principal_parent.subscribe ((item)=>{
      this.noAccountLedger.patchValue([...this.noAccountLedger.value,...this.dialogChooseAccountsList.componentInstance.accounts])
      this.dialogChooseAccountsList.close(); 
    });
  }
  toggleAllSelection() {
   this.allSelected.selected? this.entryTypes.patchValue([...this.TransactionTypes.map(item => item.id), 0]) : this.entryTypes.patchValue([]);
  }
  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    const valueArray = event.value.split(',');
    (value)? this.noAccountLedger.patchValue([...this.noAccountLedger.value,...valueArray]) : null;
    event.chipInput!.clear();
  }
  remove(account: string): void {
    const index = this.noAccountLedger.value.indexOf(account);
   (index >= 0)? this.noAccountLedger.value.splice(index, 1) : null
  }
  clearAll(event) { event.target.textContent.trim() === 'ClearAll'? this.noAccountLedger.patchValue(['ClearAll']) : null};
  addChips (el: any, column: string) {(['d_Debit', 'd_Credit'].includes(column))? this.noAccountLedger.value.push(el) : null}
  updateFilter ( el: any) {
    this.filter.nativeElement.value = el;
    this.dataSource.filter = el.trim();
    (this.dataSource.paginator)? this.dataSource.paginator.firstPage() : null;
  }
  clearFilter (input: HTMLInputElement) {
    input.value='';
    this.dataSource.filter = '';
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage()}
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage()}
  }
  exportToExcel() {
    let data = this.dataSource.data.map( (row,ind) =>({
      'Date': new Date (row.t_dataTime),
      'Debit' : row.d_Debit,
      'Credit' : row.d_Credit,
      'Amount': Number(row.t_amountTransaction),
      'Details': row.d_entryDetails,
      'TrType': row.d_transactionType,
      'TrCode' : row.t_XactTypeCode,
      't_XactTypeCode_Ext': (row.t_XactTypeCode_Ext),
      'Trade': (row.t_idtrade),
      'Code': (row.d_portfolioname) 
    }))
    this.HandlingCommonTasksS.exportToExcel (data,"entriesData")
  }
  get  gRange () {return this.searchParametersFG.get('dataRange') } 
  get  dateRangeStart() {return this.searchParametersFG.get('dateRangeStart') } 
  get  dateRangeEnd() {return this.searchParametersFG.get('dateRangeEnd') } 
  get  entryTypes () {return this.searchParametersFG.get('entryTypes') } 
  get  ExtId () {return this.searchParametersFG.get('ExtID') } 
  get  idtrade () {return this.searchParametersFG.get('idtrade') } 
  get  noAccountLedger () {return this.searchParametersFG.get('noAccountLedger') } 
  get  portfolioCodes () {return this.searchParametersFG.get('portfolioCodes') } 
}