import {AfterViewInit, Component, ViewEncapsulation, EventEmitter, Output, ViewChild} from '@angular/core';
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
import { AppAccAccountModifyFormComponent } from '../../forms/app-acc-account-modify-form/app-acc-account-modify-form ';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppConfimActionComponent } from '../../alerts/app-confim-action/app-confim-action.component';
import { MatCalendarCellClassFunction } from '@angular/material/datepicker';

export interface Fruit {
  name: string;
}
@Component({
  selector: 'app-table-balance-sheet',
  templateUrl: './app-table-balance-sheet.html',
  styleUrls: ['./app-table-balance-sheet.scss'],
  encapsulation: ViewEncapsulation.None,
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
    'totalDebit' ,  
    'totalCredit' , 
    'OutGoingBalance' , 
    'checkClosing',
    "xacttypecode"
  ]
  columnsHeaderToDisplay = [
    'No' , 
    'Type' , 
    'Previous Balance' , 
    'Balance' , 
    'Opening Balance' , 
    'total Debit' ,  
    'total Credit' ,  
    'Closing Balance' , 
    'check Closing',
     "AP"
  ];
  columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
  dataSource: MatTableDataSource<bBalanceFullData>;
  obj: MatTableDataSource<bBalanceFullData>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @Output() public modal_principal_parent = new EventEmitter();
  expandedElement: bAccountsEntriesList  | null;


  private subscriptionName: Subscription;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  
  @ViewChild('allSelected') private allSelected: MatOption;

  public readOnly: boolean = false; 
  addOnBlur = true;
  panelOpenStateFirst = false;
  panelOpenStateSecond = false;
  
  accessToClientData: string = 'true';
  action ='';
  accounts: string[] = ['ClearAll'];
  filterEntryTypes:string[] = ['ClearAll'];
  psearchParameters: any;
  TransactionTypes: bcTransactionType_Ext[] = [];
  
  dialogRef: MatDialogRef<AppAccEntryModifyFormComponent>;
  dialogChooseAccountsList: MatDialogRef<AppTableAccAccountsComponent>;
  dialogRefConfirm: MatDialogRef<AppConfimActionComponent>;
  dialogShowAccountInfo : MatDialogRef<AppAccAccountModifyFormComponent>;
  dialogShowEntriesList: MatDialogRef<AppTableAccEntriesComponent>;
  
  dateOfOperaationsStart  = new Date ('2023-02-18')
  balacedDateWithEntries : Date[]
  FirstOpenedAccountingDate : Date;
  firstClosingDate : Date;
  filterDateFormated : string;
  LastClosedDate : Date;

  searchParametersFG: FormGroup;
  filterlFormControl = new FormControl('');
  closingDate = new FormControl<Date | null>(null)
  dataRange = new FormGroup ({
    dateRangeStart: new FormControl<Date | null>(null),
    dateRangeEnd: new FormControl<Date | null>(null),
  });

  totalActive: number = 0;
  totalDebit: number = 0;
  totalPassive: number = 0;
  entriesTotal: number = 0;

  
  constructor(
    private AccountingDataService:AppAccountingService, 
    private TreeMenuSevice:TreeMenuSevice, 
    private dialog: MatDialog,
    private fb:FormBuilder, 
    public snack:MatSnackBar
  ) {
    this.AccountingDataService.GetbLastClosedAccountingDate(null,null,null,null,'GetbLastClosedAccountingDate').subscribe(data=>{
      this.FirstOpenedAccountingDate = data[0].FirstOpenedDate;
      this.LastClosedDate = data[0].LastClosedDate;
    
    })
    this.AccountingDataService.GetbbalacedDateWithEntries('GetbbalacedDateWithEntries').subscribe(data => {
      this.balacedDateWithEntries = data.flat()
      console.log('date',this.balacedDateWithEntries);
    })
    this.AccountingDataService.GetbAccountingDateToClose('GetbAccountingDateToClose').subscribe(data => {
      console.log('da',data[0].accountingDateToClose);
            this.firstClosingDate= new Date(data[0].accountingDateToClose)
    })

    
    this.subscriptionName= this.AccountingDataService.getReloadAccontList().subscribe ( (id) => {
      this.AccountingDataService.GetALLClosedBalances (null, null, new Date(this.FirstOpenedAccountingDate).toDateString(),null,'GetALLClosedBalances').subscribe (Balances  => {
        this.dataSource  = new MatTableDataSource(Balances);
        let openDates = Balances.map((el) => el.datePreviousBalance==null? el.dateBalance:null)
        console.log('open', openDates);
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
      this.AccountingDataService.GetALLClosedBalances  (null, null, new Date(this.FirstOpenedAccountingDate).toDateString(),null,'GetALLClosedBalances').subscribe (Balances  => {
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
  addChips (el: any, column: string) {(['accountNo'].includes(column))? this.accounts.push(el):null;}
  updateFilter (event:Event, el: any, column: string) {
    this.filterlFormControl.patchValue(el);
    (column=='dateBalance')? this.filterDateFormated = new Date(el).toLocaleDateString() :null
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
    let accountsList = [];
    (this.accounts.indexOf('ClearAll') !== -1)? this.accounts.splice(this.accounts.indexOf('ClearAll'),1) : null;
    (this.accounts.length===1)? accountsList = [...this.accounts,...this.accounts]: accountsList = this.accounts;
    (this.accounts.length)? Object.assign (searchObj , {'noAccountLedger': accountsList}): null;
    (this.gRange.get('dateRangeStart').value)===null? null : Object.assign (searchObj , {
      'dateRangeStart':new Date (this.gRange.get('dateRangeStart').value).toDateString()});
    (this.gRange.get('dateRangeEnd').value)===null? null : Object.assign (searchObj , {
      'dateRangeEnd': new Date (this.gRange.get('dateRangeEnd').value).toDateString()});
    ( this.entryTypes.value != null&&this.entryTypes.value.length !=0)? Object.assign (searchObj , {'entryTypes': [this.entryTypes.value]}): null;
    this.AccountingDataService.GetALLClosedBalances(searchObj,null,new Date(this.FirstOpenedAccountingDate).toDateString(), null, 'GetALLClosedBalances').subscribe (Balances  => {
      this.dataSource  = new MatTableDataSource(Balances);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.accounts.unshift('ClearAll')
      resolve(Balances) 
    })
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
    if (row.accountType==='Account') {
      this.AccountingDataService.GetAccountData(null,null,null, row.accountNo,'GetAccountData').subscribe ((accountData) => {
        this.dialogShowAccountInfo = this.dialog.open(AppAccAccountModifyFormComponent ,{minHeight:'600px', minWidth:'900px', autoFocus: false, maxHeight: '90vh'});
        this.dialogShowAccountInfo.componentInstance.aType = 0;
        this.dialogShowAccountInfo.componentInstance.action = 'View';
        this.dialogShowAccountInfo.componentInstance.data = accountData[0]; 
        this.dialogShowAccountInfo.componentInstance.modal_principal_parent.subscribe ((item)=>{
          this.dialogChooseAccountsList.close(); 
        });
      })
    } else {
      this.AccountingDataService.GetLedgerData(null,null,null, row.accountNo,'GetLedgerData').subscribe ((accountData) => {
        this.dialogShowAccountInfo = this.dialog.open(AppAccAccountModifyFormComponent ,{minHeight:'600px', minWidth:'900px', autoFocus: false, maxHeight: '90vh'});
        this.dialogShowAccountInfo.componentInstance.aType = 1;
        this.dialogShowAccountInfo.componentInstance.action = 'View';
        this.dialogShowAccountInfo.componentInstance.data = accountData[0]; 
        this.dialogShowAccountInfo.componentInstance.modal_principal_parent.subscribe ((item)=>{
          this.dialogChooseAccountsList.close(); 
        });
      })
    }
  }
  exportToExcel() {
   const fileName = "balancesData.xlsx";
   let obj = this.dataSource.data.map( (row,ind) =>({
    'accountId': Number(row.accountId),
    'accountNo' : row.accountNo,
    'dateBalance' : new Date (row.dateBalance),
    'openingBalance': Number(row.openingBalance),
    'totalDebit': Number(row.totalDebit),
    'totalCredit': Number(row.totalCredit),
    'outBalance' : Number(row.OutGoingBalance),
    'xacttypecode': (row.accountType)
  }))

   const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(obj);
   const wb: XLSX.WorkBook = XLSX.utils.book_new();
   XLSX.utils.book_append_sheet(wb, ws, "balancesData");
   XLSX.writeFile(wb, fileName);
  }
  async updateResultHandler (result :any, action: string) {
    console.log('res',result);
    if (result['name']=='error') {
      this.snack.open('Error: ' + result['detail'].split("\n", 1).join(""),'OK',{panelClass: ['snackbar-error']}); 
    } else {
      this.snack.open(action +': ' + result + ' entry','OK',{panelClass: ['snackbar-success'], duration: 3000});
      this.dialog.closeAll();
      await this.submitQuery();
      this.AccountingDataService.GetbLastClosedAccountingDate(null,null,null,null,'GetbLastClosedAccountingDate').subscribe(data=>{
        this.FirstOpenedAccountingDate = data[0].FirstOpenedDate;
        this.LastClosedDate = data[0].LastClosedDate;
      })
      this.AccountingDataService.GetbbalacedDateWithEntries('GetbbalacedDateWithEntries').subscribe(data => {
        this.balacedDateWithEntries = data.flat()
        console.log('date',this.balacedDateWithEntries);
      })
      this.AccountingDataService.GetbAccountingDateToClose('GetbAccountingDateToClose').subscribe(data => {
        this.firstClosingDate = new Date(data[0].accountingDateToClose)
      })
    }
  }
  accountingBalanceClose (overdraftOverride:boolean) {
    let balanceCanBeClosed:boolean = false;
    this.dialogRefConfirm = this.dialog.open(AppConfimActionComponent, {panelClass: 'custom-modalbox',} );
    this.dialogRefConfirm.componentInstance.actionToConfim = {'action':'Closing date: ' + new Date(this.firstClosingDate).toDateString() ,'isConfirmed': false}
    this.dialogRefConfirm.afterClosed().subscribe (actionToConfim => {
      if (actionToConfim.isConfirmed===true) {
        this.dataSource.data = this.dataSource.data.filter(elem=>
          new Date(elem.dateBalance).toDateString()===this.firstClosingDate.toDateString() && elem.OutGoingBalance<0
        )
        if (this.dataSource.data.length) {
          if (overdraftOverride) {
            this.dialogRefConfirm = this.dialog.open(AppConfimActionComponent, {panelClass: 'custom-modalbox',} );
            this.dialogRefConfirm.componentInstance.actionToConfim = {'action':'Close balance with overdrafts','isConfirmed': false}
            this.dialogRefConfirm.afterClosed().subscribe (overdraftOverrideToConfim => {
              overdraftOverrideToConfim.isConfirmed? this.executeClosingBalance() : null;
            })
          } else {
            this.snack.open('Accounts with overdrafts. Balance has not been closed','OK',{panelClass: ['snackbar-error']})
          } 
        }
        else {this.executeClosingBalance()}
      }
    })
  } 
  executeClosingBalance () {
    this.AccountingDataService.accountingBalanceCloseInsert ({'closingDate' : new Date(this.firstClosingDate).toDateString()}).then ((result) => this.updateResultHandler(result,'Balance was closed for '+ new Date(this.firstClosingDate).toDateString()+ '. Created'))
  }
  async checkBalance (dateBalance: string) {
    this.totalPassive = 0;
    this.totalActive = 0;
    this.totalDebit = 0;
    console.log('db',dateBalance);
    this.gRange.get('dateRangeStart').setValue(new Date(dateBalance))  
    this.gRange.get('dateRangeEnd').setValue(new Date(dateBalance))
     await this.submitQuery();
     this.AccountingDataService.GetbAccountingSumTransactionPerDate(dateBalance,'SumTransactionPerDate').subscribe ((totalTransaction) => this.entriesTotal = totalTransaction[0].amountTransaction)
     this.dataSource.data.forEach ((el) => {
      this.totalDebit += Number(el.totalDebit)
      Number(el['xacttypecode']) == 1 ? this.totalPassive = this.totalPassive + Number(el.OutGoingBalance): this.totalActive =this.totalActive + Number(el.OutGoingBalance)
      console.log('ap',el['xacttypecode'].value);
     })
  }


  dateClass: MatCalendarCellClassFunction<Date> = (cellDate, view) => {
    let result :string
    // console.log('dc',cellDate.toLocaleDateString(), new Date(this.balacedDateWithEntries[1]).toLocaleDateString());
    const index = this.balacedDateWithEntries.findIndex(x => new Date(x).toLocaleDateString() == cellDate.toLocaleDateString());
    return (index > -1)? 'date-orange' : '';
  };
  openBalance (date:string) {
    this.dialogRefConfirm = this.dialog.open(AppConfimActionComponent, {panelClass: 'custom-modalbox',} );
    this.dialogRefConfirm.componentInstance.actionToConfim = {'action':'Open date: ' + date ,'isConfirmed': false}
    this.dialogRefConfirm.afterClosed().subscribe (actionToConfim => {
      console.log('action', actionToConfim)
      if (actionToConfim.isConfirmed===true) {
        this.AccountingDataService.accountingBalanceDayOpen({'dateToOpen' : new Date(date).toDateString()}).then ((result) => 
        this.updateResultHandler(result, 'Operational day ' + new Date(date).toDateString()+ ' has been opened'))
      }
    })
  }
  balanceDeepCheck (dataToCheck:string, firstDayOfCalculation: string) {
    this.entriesTotal = 0;
    this.totalDebit = 0;
    this.AccountingDataService.GetDeepBalanceCheck(dataToCheck,firstDayOfCalculation,'GetDeepBalanceCheck').subscribe((balanceDataToReconcile) => {
      this.dataSource  = new MatTableDataSource(balanceDataToReconcile);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      balanceDataToReconcile.forEach ( (el) => {
        console.log(new Date(el['dateBalance']).toDateString() , firstDayOfCalculation );
        new Date(el['dateBalance']).toDateString() == firstDayOfCalculation ? this.entriesTotal += Number(el.OutGoingBalance): this.totalDebit += Number(el.OutGoingBalance)
      });
        
    })
  }
  returnNumber (elem:string):number {
    return Number(elem)
  }
  get  gRange () {return this.searchParametersFG.get('dataRange') } 
  get  dateRangeStart() {return this.searchParametersFG.get('dateRangeStart') } 
  get  dateRangeEnd() {return this.searchParametersFG.get('dateRangeEnd') } 
  get  entryTypes () {return this.searchParametersFG.get('entryType') } 
  
}