import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {lastValueFrom, Subscription } from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {TreeMenuSevice } from 'src/app/services/tree-menu.service';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { bAccountsEntriesList, bcTransactionType_Ext } from 'src/app/models/intefaces';
import { AppAccountingService } from 'src/app/services/app-accounting.service';
import { AppAccEntryModifyFormComponent } from '../../forms/acc-entry-form/acc-entry-form';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {MatChipInputEvent} from '@angular/material/chips';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AppTableAccAccountsComponent } from '../acc-accounts-table/acc-accounts-table';
import { MatOption } from '@angular/material/core';
import * as XLSX from 'xlsx'
import { menuColorGl } from 'src/app/models/constants';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { formatNumber } from '@angular/common';

@Component({
  selector: 'app-table-acc-entries',
  templateUrl: './acc-entries-table.html',
  styleUrls: ['./acc-entries-table.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class AppTableAccEntriesComponent  {
  columnsToDisplay = [
    'd_Debit',
    'd_Credit',
    't_dataTime', 
    'd_xActTypeCodeExtName', 
    't_XactTypeCode',  
    't_amountTransaction', 
    'd_entryDetails', 
    't_extTransactionId'
  ]
  columnsHeaderToDisplay = [
    'debit',
    'credit',
    'dataTime', 
    'Code', 
    'Ledger',  
    'amount', 
    'Details', 
    'ExtId',
    'Action'
  ];
  columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
  dataSource: MatTableDataSource<bAccountsEntriesList>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @Output() public modal_principal_parent = new EventEmitter();
  expandedElement: bAccountsEntriesList  | null;
  accessToClientData: string = 'true';
  @Input() readOnly: boolean = false; 
  @Input() action :string = '';
  @Input() externalId: number = null;
  dialogRef: MatDialogRef<AppAccEntryModifyFormComponent>;
  private subscriptionName: Subscription;
  public FirstOpenedAccountingDate : Date;
  menuColorGl=menuColorGl
  filterlFormControl = new FormControl('');
  addOnBlur = true;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  dataRange = new FormGroup ({
    dateRangeStart: new FormControl<Date | null>(null),
    dateRangeEnd: new FormControl<Date | null>(null),
  });
  @ViewChild('allSelected') private allSelected: MatOption;
  
  panelOpenState = false;
  public searchParametersFG: FormGroup;
  public searchParameters: any;
  accounts: string[] = ['ClearAll'];
  dialogChooseAccountsList: MatDialogRef<AppTableAccAccountsComponent>;
  TransactionTypes: bcTransactionType_Ext[] = [];
  filterEntryTypes:string[] = ['ClearAll'];
  paramRowData : any = null;
  constructor(
    private AccountingDataService:AppAccountingService, 
    private CommonDialogsService:HadlingCommonDialogsService,
    private TreeMenuSevice:TreeMenuSevice, 
    private dialog: MatDialog,
    private fb:FormBuilder 
  ) {
    this.searchParametersFG = this.fb.group ({
      dataRange : this.dataRange,
      noAccountLedger: null,
      amount:{value:null, disabled:true},
      entryType : {value:[], disabled:false},
      ExtID:{value:null, disabled:false}
    })
    this.columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];

    this.AccountingDataService.GetTransactionType_Ext('',0,'','','bcTransactionType_Ext').subscribe (
      data => this.TransactionTypes = data)
    this.AccountingDataService.GetbLastClosedAccountingDate(null,null,null,null,'GetbLastClosedAccountingDate').subscribe(data => this.FirstOpenedAccountingDate = data[0].FirstOpenedDate)
    this.AccountingDataService.getReloadEntryList().subscribe(data => this.submitQuery())
  }
  async ngOnInit() {
    switch (this.action) {
      case 'ShowEntriesForBalanceSheet':
        this.accounts = [this.paramRowData.accountNo];
        this.dataRange.controls['dateRangeStart'].setValue(new Date (this.paramRowData.dateBalance))
        this.dataRange.controls['dateRangeEnd'].setValue(new Date (this.paramRowData.dateBalance))
      break;
      case 'ViewEntriesByExternalId':
        this.ExtId.setValue(this.externalId)
      break;
    }

    let userData = JSON.parse(localStorage.getItem('userInfo'))
    await lastValueFrom (this.TreeMenuSevice.getaccessRestriction (userData.user.accessrole, 'accessToClientData'))
    .then ((accessRestrictionData) =>{
      this.accessToClientData = accessRestrictionData['elementvalue']
      switch (this.action) {
        case 'ShowEntriesForBalanceSheet': 
          this.submitQuery();
        break;
        case 'ViewEntriesByExternalId': 
          this.submitQuery();
        break;
        default :
          this.AccountingDataService.GetAccountsEntriesListAccounting (null,null,null,null,'GetAccountsEntriesListAccounting').subscribe (EntriesList  => {
            this.dataSource  = new MatTableDataSource(EntriesList);
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
          })
        break;
      }
    })
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage();}
  }
  openEntryModifyForm (actionType:string, row: any ) {
    this.dialogRef = this.dialog.open(AppAccEntryModifyFormComponent ,{minHeight:'400px', maxWidth:'1000px' });
    this.dialogRef.componentInstance.action = actionType;
    this.dialogRef.componentInstance.title = ['Create','CreateLL','Create_Example'].includes(actionType)? actionType: 'Create New';
    this.dialogRef.componentInstance.data =  row;
    this.dialogRef.componentInstance.FirstOpenedAccountingDate = this.FirstOpenedAccountingDate;
    switch (actionType) {
      case 'Create':
        this.dialogRef.componentInstance.data = {t_XactTypeCode:1, d_transactionType:'AL'};
      break;
      case 'CreateLL':
        this.dialogRef.componentInstance.action = 'Create';
        this.dialogRef.componentInstance.title = 'Create';
        this.dialogRef.componentInstance.data = {t_XactTypeCode:0, d_transactionType:'LL'} 
      break;
      case 'View':
        this.dialogRef.componentInstance.entryModifyForm.disable()
      break;
    }
  }
  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    const valueArray = event.value.split(',');
    (value)? this.accounts = [...this.accounts,...valueArray] : null;
    event.chipInput!.clear();
  }
  remove(account: string): void {
    const index = this.accounts.indexOf(account);
   (index >= 0)? this.accounts.splice(index, 1) : null
  }
  clearAll(event) {
  event.target.textContent.trim() === 'ClearAll cancel'? this.accounts = ['ClearAll']: null;
  }
  addChips (el: any, column: string) {(['d_Debit', 'd_Credit'].includes(column))? this.accounts.push(el):null;}
  updateFilter (event:Event, el: any) {
    this.filterlFormControl.patchValue(el);
    this.dataSource.filter = el.trim();
    (this.dataSource.paginator)? this.dataSource.paginator.firstPage() : null;
  }
  clearFilter () {
    this.filterlFormControl.patchValue('')
    this.dataSource.filter = ''
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage()}
  }
  submitQuery () {
    let searchObj = {};
    let accountsList = [];
    (this.accounts.indexOf('ClearAll') !== -1)? this.accounts.splice(this.accounts.indexOf('ClearAll'),1) : null;
    (this.accounts.length===1)? accountsList = [...this.accounts,...this.accounts]: accountsList = this.accounts;
    (this.accounts.length)? Object.assign (searchObj , {'noAccountLedger': accountsList}): null;
    (this.gRange.get('dateRangeStart').value)===null? null : Object.assign (searchObj , {
      'dateRangeStart':new Date (this.gRange.get('dateRangeStart').value).toDateString()});
    (this.gRange.get('dateRangeEnd').value)===null? null : Object.assign (searchObj , {
      'dateRangeEnd': new Date (this.gRange.get('dateRangeEnd').value).toDateString()});
    ( this.entryTypes.value != null&&this.entryTypes.value.length !=0)? Object.assign (searchObj , {'entryTypes': [this.entryTypes.value]}): null;
    (this.ExtId.value) == null?  null : Object.assign (searchObj , {'extTransactionId': this.ExtId.value});
    this.AccountingDataService.GetAccountsEntriesListAccounting(searchObj,null,null, null, 'GetAccountsEntriesListAccounting').subscribe (EntriesList  => {
      this.dataSource  = new MatTableDataSource(EntriesList);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.accounts.unshift('ClearAll')
      this.CommonDialogsService.snackResultHandler({name:'success',detail: formatNumber (EntriesList.length,'en-US') + ' rows loaded'});
    })
  }
  selectAccounts (typeAccount: string) {
    this.dialogChooseAccountsList = this.dialog.open(AppTableAccAccountsComponent ,{minHeight:'600px', minWidth:'1700px', autoFocus: false, maxHeight: '90vh'});
    this.dialogChooseAccountsList.componentInstance.action = "GetALLAccountsDataWholeList";
    this.dialogChooseAccountsList.componentInstance.readOnly = true;
    this.dialogChooseAccountsList.componentInstance.multiSelect = true;
    this.dialogChooseAccountsList.componentInstance.modal_principal_parent.subscribe ((item)=>{
      this.accounts = [...this.accounts,...this.dialogChooseAccountsList.componentInstance.accounts]
      this.dialogChooseAccountsList.close(); 
    });
  }
  toggleAllSelection() {
    if (this.allSelected.selected) {
      this.entryTypes.patchValue([...this.TransactionTypes.map(item => item.id), 0]);
    } else {
      this.entryTypes.patchValue([]);
    }
  }
  exportToExcel() {
    const fileName = "entriesData.xlsx";
    let obj = this.dataSource.data.map( (row,ind) =>({
      'Date': new Date (row.t_dataTime),
      'Debit' : row.d_Debit,
      'Credit' : row.d_Credit,
      'Amount': Number(row.t_amountTransaction),
      'Details': row.d_entryDetails,
      'TrType': row.d_transactionType,
      'TrCode' : row.t_XactTypeCode,
      't_XactTypeCode_Ext': (row.t_XactTypeCode_Ext)
    }))
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(obj);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "entriesData");
    XLSX.writeFile(wb, fileName);
  }
  get  gRange () {return this.searchParametersFG.get('dataRange') } 
  get  dateRangeStart() {return this.searchParametersFG.get('dateRangeStart') } 
  get  dateRangeEnd() {return this.searchParametersFG.get('dateRangeEnd') } 
  get  entryTypes () {return this.searchParametersFG.get('entryType') } 
  get  ExtId () {return this.searchParametersFG.get('ExtID') } 
  
 
}