import {AfterViewInit, Component, EventEmitter, Output, ViewChild} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {lastValueFrom, Subscription } from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {TreeMenuSevice } from 'src/app/services/tree-menu.service';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { bAccountsEntriesList, bBalanceFullData, bcTransactionType_Ext } from 'src/app/models/accounts-table-model';
import { AppAccountingService } from 'src/app/services/app-accounting.service';
import { AppAccEntryModifyFormComponent } from '../../forms/app-acc-entry-modify-form/app-acc-entry-modify-form';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {MatChipInputEvent} from '@angular/material/chips';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import * as XLSX from 'xlsx'
import { MatOption } from '@angular/material/core';
import { AppTableAccAccountsComponent } from '../app-table-acc-accounts/app-table-acc-accounts';
import { AppTableAccEntriesComponent } from '../app-table-acc-entries/app-table-acc-entries';

export interface Fruit {
  name: string;
}
@Component({
  selector: 'app-table-balance-sheet',
  templateUrl: './app-table-balance-sheet.html',
  styleUrls: ['./app-table-balance-sheet.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class AppTableBalanceSheetComponent  implements AfterViewInit {
  columnsToDisplay = [
    'accountNo' , 
    'accountType' , 
    'datePreviousBalance' , 
    'dateBalance' , 
    'openingBalance' , 
    'totalCredit' , 
    'totalDebit' , 
    'OutGoingBalance' , 
    'checkClosing'
  ]
  columnsHeaderToDisplay = [
    'No' , 
    'Type' , 
    'Previous Balance' , 
    'Balance' , 
    'Opening Balance' , 
    'Total Credit' , 
    'Total Debit' , 
    'Closing Balance' , 
    'check Closing'
  ];
  columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
  dataSource: MatTableDataSource<bBalanceFullData>;
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
  dataRange = new FormGroup ({
    dateRangeStart: new FormControl<Date | null>(null),
    dateRangeEnd: new FormControl<Date | null>(null),
  });
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  
  filterlFormControl = new FormControl('');
  @ViewChild('allSelected') private allSelected: MatOption;
  
  panelOpenState = false;
  public searchParametersFG: FormGroup;
  public searchParameters: any;
  accounts: string[] = ['ClearAll'];
  addOnBlur = true;
  
  dialogChooseAccountsList: MatDialogRef<AppTableAccAccountsComponent>;

  TransactionTypes: bcTransactionType_Ext[] = [];
  filterEntryTypes:string[] = ['ClearAll'];
  
  dialogShowEntriesList: MatDialogRef<AppTableAccEntriesComponent>;

  constructor(
    private AccountingDataService:AppAccountingService, 
    private TreeMenuSevice:TreeMenuSevice, 
    private dialog: MatDialog,
    private fb:FormBuilder 

  ) {
    this.AccountingDataService.GetbLastClosedAccountingDate(null,null,null,null,'GetbLastClosedAccountingDate').subscribe(data => this.FirstOpenedAccountingDate = data[0].FirstOpenedDate)
    this.subscriptionName= this.AccountingDataService.getReloadAccontList().subscribe ( (id) => {
      this.AccountingDataService.GetALLClosedBalances (null,null,null,null,'GetALLClosedBalances').subscribe (Balances  => {
        this.dataSource  = new MatTableDataSource(Balances);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      })
    } )
    this.searchParametersFG = this.fb.group ({
      dataRange : this.dataRange,
      noAccountLedger: null,
      amount:{value:null, disabled:true},
      entryType : {value:[], disabled:true}
    })
  }

  async ngAfterViewInit() {
    this.columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
    let userData = JSON.parse(localStorage.getItem('userInfo'))
    await lastValueFrom (this.TreeMenuSevice.getaccessRestriction (userData.user.accessrole, 'accessToClientData'))
    .then ((accessRestrictionData) =>{
      this.accessToClientData = accessRestrictionData['elementvalue']
      this.AccountingDataService.GetALLClosedBalances  (null,null,null,null,'GetALLClosedBalances').subscribe (Balances  => {
        this.dataSource  = new MatTableDataSource(Balances);
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

    this.AccountingDataService.GetALLClosedBalances(searchObj,null,null, null, 'GetALLClosedBalances').subscribe (Balances  => {
      this.dataSource  = new MatTableDataSource(Balances);
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
  showEntries (row : any) {
    this.dialogShowEntriesList = this.dialog.open(AppTableAccEntriesComponent ,{minHeight:'600px', minWidth:'1700px', autoFocus: false, maxHeight: '90vh'});
    console.log('dd',row.dateBalance);
    this.dialogShowEntriesList.componentInstance.paramRowData = row; 
    this.dialogShowEntriesList.componentInstance.action = 'ShowEntriesForBalanceSheet';
    this.dialogShowEntriesList.componentInstance.modal_principal_parent.subscribe ((item)=>{
      // this.accounts = [...this.accounts,...this.dialogShowEntriesList.componentInstance.accounts]
      this.dialogChooseAccountsList.close(); 
    });
  }
  showAccounInfo (row : any) {
    
  }
  exportToExcel() {
   const fileName = "balancesData.xlsx";
   const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.dataSource.data);
   const wb: XLSX.WorkBook = XLSX.utils.book_new();
   XLSX.utils.book_append_sheet(wb, ws, "balancesData");
   XLSX.writeFile(wb, fileName);
  }
  get  gRange () {return this.searchParametersFG.get('dataRange') } 
  get  dateRangeStart() {return this.searchParametersFG.get('dateRangeStart') } 
  get  dateRangeEnd() {return this.searchParametersFG.get('dateRangeEnd') } 
  get  entryTypes () {return this.searchParametersFG.get('entryType') } 
  
}