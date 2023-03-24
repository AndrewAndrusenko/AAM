import {AfterViewInit, Component, EventEmitter, Output, ViewChild} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {lastValueFrom, Subscription } from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {TreeMenuSevice } from 'src/app/services/tree-menu.service';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { bAccountingEntriesComplexSearch, bAccountsEntriesList, bcTransactionType_Ext } from 'src/app/models/accounts-table-model';
import { AppAccountingService } from 'src/app/services/app-accounting.service';
import { AppAccEntryModifyFormComponent } from '../../forms/app-acc-entry-modify-form/app-acc-entry-modify-form';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {MatChipInputEvent} from '@angular/material/chips';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AppTableAccAccountsComponent } from '../app-table-acc-accounts/app-table-acc-accounts';
import { MatOption } from '@angular/material/core';
import * as XLSX from 'xlsx'

@Component({
  selector: 'app-table-acc-entries',
  templateUrl: './app-table-acc-entries.html',
  styleUrls: ['./app-table-acc-entries.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class AppTableAccEntriesComponent  implements AfterViewInit {
  columnsToDisplay = [
    'd_Debit',
    'd_Credit',
    't_dataTime', 
    't_XactTypeCode',  
    'd_xActTypeCodeExtName', 
    't_amountTransaction', 
    'd_entryDetails', 
  ]
  columnsHeaderToDisplay = [
    'debit',
    'credit',
    'dataTime', 
    'Ledger',  
    'Code', 
    'amount', 
    'Details', 
  ];
  columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
  dataSource: MatTableDataSource<bAccountsEntriesList>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @Output() public modal_principal_parent = new EventEmitter();
  expandedElement: bAccountsEntriesList  | null;
  accessToClientData: string = 'true';
  public readOnly: boolean = false; 
  action ='';
  dialogRef: MatDialogRef<AppAccEntryModifyFormComponent>;
  private subscriptionName: Subscription;
  public FirstOpenedAccountingDate : Date;
 
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
  
  constructor(
    private AccountingDataService:AppAccountingService, 
    private TreeMenuSevice:TreeMenuSevice, 
    private dialog: MatDialog,
    private fb:FormBuilder 

  ) {
    this.AccountingDataService.GetTransactionType_Ext('',0,'','','bcTransactionType_Ext').subscribe (
      data => this.TransactionTypes = data)
    this.AccountingDataService.GetbLastClosedAccountingDate(null,null,null,null,'GetbLastClosedAccountingDate').subscribe(data => this.FirstOpenedAccountingDate = data[0].FirstOpenedDate)
    this.subscriptionName= this.AccountingDataService.getReloadAccontList().subscribe ( (id) => {
      this.AccountingDataService.GetAccountsEntriesListAccounting (null,null,null,null,'GetAccountsEntriesListAccounting').subscribe (EntriesList  => {
        this.dataSource  = new MatTableDataSource(EntriesList);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      })
    } )
    this.searchParametersFG = this.fb.group ({
      dataRange : this.dataRange,
      noAccountLedger: null,
      amount:{value:null, disabled:true},
      entryType : {value:[], disabled:false}
    })
  }

  async ngAfterViewInit() {
    this.columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
    let userData = JSON.parse(localStorage.getItem('userInfo'))
    await lastValueFrom (this.TreeMenuSevice.getaccessRestriction (userData.user.accessrole, 'accessToClientData'))
    .then ((accessRestrictionData) =>{
      this.accessToClientData = accessRestrictionData['elementvalue']
      this.AccountingDataService.GetAccountsEntriesListAccounting (null,null,null,null,'GetAccountsEntriesListAccounting').subscribe (EntriesList  => {
        this.dataSource  = new MatTableDataSource(EntriesList);
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
  openEntryModifyForm (actionType:string, row: any ) {
    console.log('row', row);
    this.dialogRef = this.dialog.open(AppAccEntryModifyFormComponent ,{minHeight:'400px', maxWidth:'1000px' });
    this.dialogRef.componentInstance.action = actionType;
    this.dialogRef.componentInstance.title = actionType;
    this.dialogRef.componentInstance.data = row;
    this.dialogRef.componentInstance.FirstOpenedAccountingDate = this.FirstOpenedAccountingDate;
    switch (actionType) {
      case 'Create':
      case 'Create_Example': 
      this.dialogRef.componentInstance.title = 'Create New';
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
  console.log('event', event.target.textContent);
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

    console.log('searchParameters',searchObj);

    this.AccountingDataService.GetAccountsEntriesListAccounting(searchObj,null,null, null, 'GetAccountsEntriesListAccounting').subscribe (EntriesList  => {
      this.dataSource  = new MatTableDataSource(EntriesList);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
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
      console.log('tp', this.TransactionTypes.map(item => item.id))
    } else {
      this.entryTypes.patchValue([]);
    }
  }

  exportToExcel() {
    // implement your logic to make the data set from your original dataset.
/*     let data = [
     { title: "Accession Number", show: true, link: "accessionNumber" },
     { title: "Title", show: true, link: "title" },
     { title: "Sub Title", show: true, link: "subTitle" },
     { title: "Status", show: true, link: "status" },
     { title: "Authors", show: true, link: "authors" },
     { title: "ISBN", show: true, link: "isbn" },
     { title: "ISBN 10", show: true, link: "isbn10" },
     { title: "ISBN 13", show: true, link: "isbn13" },
     { title: "Subjects", show: true, link: "subjects" },
     { title: "Publishers", show: true, link: "publishers" },
     { title: "Vendors", show: true, link: "vendors" },
     { title: "Contributors", show: true, link: "contributors" },
     { title: "Collaborators", show: true, link: "collaborators" }
   ]; */
   let data = [
     { title: "d_transactionType", show: true, link: "d_transactionType" }, 
     { title: "t_id", show: true, link: "t_id" },
     { title: "t_entryDetails", show: true, link: "t_entryDetails" }, 
     { title: "t_ledgerNoId", show: true, link: "t_ledgerNoId" }, 
     { title: "t_accountId", show: true, link: "t_accountId" }, 
     { title: "t_extTransactionId" , show: true, link: "t_extTransactionId" }, 
     { title: "t_dataTime", show: true, link: "t_dataTime" }, 
     { title: "t_amountTransaction", show: true, link: "t_amountTransaction" }, 
     { title: "t_XactTypeCode", show: true, link: "t_XactTypeCode" },  
     { title: "t_XactTypeCode_Ext", show: true, link: "t_XactTypeCode_Ext" }, 
     { title: "d_Debit", show: true, link: "d_Debit" },  
     { title: "d_Credit" , show: true, link: "d_Credit" },  
     { title: "d_ledgerNo", show: true, link: "d_ledgerNo" }, 
     { title: "d_accountNo", show: true, link: "d_accountNo" },  
     { title: "d_xActTypeCode_ExtName" , show: true, link: "d_xActTypeCode_ExtName" }, 
     { title: "d_entryDetails", show: true, link: "d_entryDetails" }, 
    ]
    const fileName = "test.xlsx";
   const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.dataSource.data);
   const wb: XLSX.WorkBook = XLSX.utils.book_new();
   XLSX.utils.book_append_sheet(wb, ws, "test");
  
   XLSX.writeFile(wb, fileName);
  }
  get  gRange () {return this.searchParametersFG.get('dataRange') } 
  get  dateRangeStart() {return this.searchParametersFG.get('dateRangeStart') } 
  get  dateRangeEnd() {return this.searchParametersFG.get('dateRangeEnd') } 
  get  entryTypes () {return this.searchParametersFG.get('entryType') } 
  
 
}