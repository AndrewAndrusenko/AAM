import { Component, ViewEncapsulation, EventEmitter, Output, ViewChild} from '@angular/core';
import { MatPaginator as MatPaginator} from '@angular/material/paginator';
import { MatSort} from '@angular/material/sort';
import { Subscription, filter, firstValueFrom } from 'rxjs';
import { MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import { animate, state, style, transition, trigger} from '@angular/animations';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { bAccountsEntriesList, bBalanceFullData, bcTransactionType_Ext } from 'src/app/models/intefaces.model';
import { AppAccountingService } from 'src/app/services/accounting.service';
import { COMMA, ENTER} from '@angular/cdk/keycodes';
import { MatChipInputEvent} from '@angular/material/chips';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatOption } from '@angular/material/core';
import { AppTableAccAccountsComponent } from '../acc-accounts-table.component/acc-accounts-table.component';
import { AppTableAccEntriesComponent } from '../acc-entries-table.component/acc-entries-table.component';
import { AppAccAccountModifyFormComponent } from '../../forms/acc-account-form.component/acc-account-form.component';
import { MatCalendarCellClassFunction } from '@angular/material/datepicker';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { menuColorGl } from 'src/app/models/constants.model';
import { formatNumber } from '@angular/common';
import { HandlingCommonTasksService } from 'src/app/services/handling-common-tasks.service';
import { AuthService } from 'src/app/services/auth.service';
import { ReadableStreamDefaultReader } from 'stream/web';
@Component({
  selector: 'app-table-balance-sheet',
  templateUrl: './acc-balance-sheet-table.component.html',
  styleUrls: ['./acc-balance-sheet-table.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class AppTableBalanceSheetComponent   {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  columnsToDisplay = ['portfolioname','accountNo','accountType','datePreviousBalance','dateBalance','openingBalance','totalDebit','totalCredit','OutGoingBalance','checkClosing',"xacttypecode"]
  columnsHeaderToDisplay = ['Code','No','Type','Previous Balance','Balance', 'Opening Balance','total Debit','total Credit','Closing Balance',    'check Closing',"AP"];
  columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
  dataSource: MatTableDataSource<bBalanceFullData>;
  obj: MatTableDataSource<bBalanceFullData>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @Output() public modal_principal_parent = new EventEmitter();
  expandedElement: bAccountsEntriesList  | null;
  menuColorGl=menuColorGl
  private subscriptionName: Subscription;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  
  @ViewChild('allSelected') private allSelected: MatOption;

  public readOnly: boolean = false; 
  ;
  panelOpenStateFirst = false;
  panelOpenStateSecond = false;
  
  accessToClientData: string = 'true';
  action ='';
  accounts: string[] = ['ClearAll'];
  filterEntryTypes:string[] = ['ClearAll'];
  psearchParameters: any;
  TransactionTypes: bcTransactionType_Ext[] = [];
  
  dialogChooseAccountsList: MatDialogRef<AppTableAccAccountsComponent>;
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
    private AuthServiceS:AuthService,  
    private CommonDialogsService:HadlingCommonDialogsService,
    private HandlingCommonTasksS:HandlingCommonTasksService, 
    private dialog: MatDialog,
    private fb:FormBuilder, 
  ) {
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToTradesData')[0].elementvalue;
    this.disabledControlElements = this.accessState === 'full'? false : true;

    this.AccountingDataService.GetbbalacedDateWithEntries('GetbbalacedDateWithEntries').subscribe(data => this.balacedDateWithEntries = data[0]['datesarray']);
    this.AccountingDataService.GetbAccountingDateToClose('GetbAccountingDateToClose').subscribe(data =>this.firstClosingDate= new Date(data[0].accountingDateToClose));
    this.searchParametersFG = this.fb.group ({
      dataRange : this.dataRange,
      noAccountLedger: null,
      amount:{value:null, disabled:true},
      entryType : {value:[], disabled:true}
    })
  }
  async ngOnInit(): Promise<void> {
    const period = await firstValueFrom(this.AccountingDataService.GetbLastClosedAccountingDate('GetbLastClosedAccountingDate'))
    this.FirstOpenedAccountingDate = period[0].FirstOpenedDate;
    this.LastClosedDate = period[0].LastClosedDate;
    this.AccountingDataService.GetALLClosedBalances(null,null,new Date(this.FirstOpenedAccountingDate).toDateString(), null, 'GetALLClosedBalances').subscribe (Balances => this.updateBalanceData(Balances))
  }
  updateBalanceData(Balances:bBalanceFullData[]){
      this.dataSource  = new MatTableDataSource(Balances);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
  }
  async updateResultHandler (result :any, action: string, showSnackMsg:boolean=true,duration?:number, checkBalance=false,refreshData=false) {
    this.CommonDialogsService.snackResultHandler(result, action,undefined,undefined,duration)
    if (result['name']!=='error') {
      // await this.submitQuery(showSnackMsg);
      this.AccountingDataService.GetbLastClosedAccountingDate('GetbLastClosedAccountingDate').subscribe(data=>{
        this.FirstOpenedAccountingDate = data[0].FirstOpenedDate;
        this.LastClosedDate = data[0].LastClosedDate;
        checkBalance? this.checkBalance(new Date(this.LastClosedDate).toLocaleDateString(),false):null;
        refreshData? this.AccountingDataService.GetALLClosedBalances(null,null,new Date(this.FirstOpenedAccountingDate).toDateString(), null, 'GetALLClosedBalances').subscribe (Balances => this.updateBalanceData(Balances)):null;
      })
      this.AccountingDataService.GetbbalacedDateWithEntries('GetbbalacedDateWithEntries').subscribe(data => {
        this.balacedDateWithEntries = data.flat()
      })
      this.AccountingDataService.GetbAccountingDateToClose('GetbAccountingDateToClose').subscribe(data => {
        this.firstClosingDate = new Date(data[0].accountingDateToClose)
      })
    }
  }
  async submitQuery (showSnackMsg:boolean=true) {
    this.AccountingDataService.GetbAccountingDateToClose('GetbAccountingDateToClose').subscribe(data =>this.firstClosingDate= new Date(data[0].accountingDateToClose));
    return new Promise((resolve, reject) => {
    this.dataSource.data=null;
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
      this.updateBalanceData(Balances);
      this.accounts.unshift('ClearAll')
      showSnackMsg? this.CommonDialogsService.snackResultHandler({name:'success',detail: formatNumber (Balances.length,'en-US') + ' rows'}, 'Loaded') : null;
      resolve(Balances) 
    })
  })
  }
  async accountingBalanceClose (overdraftOverride:boolean) {
    const currentDateToClose = await firstValueFrom(this.AccountingDataService.GetbAccountingDateToClose('GetbAccountingDateToClose'));
    if (new Date(currentDateToClose[0].accountingDateToClose).toLocaleDateString()!==this.firstClosingDate.toLocaleDateString()) {
        return this.CommonDialogsService.snackResultHandler({name:'error',detail:'Entries dated ' + new Date(currentDateToClose[0].accountingDateToClose).toLocaleDateString()+ ' have been generated. Please reload the page!'});
    } 
    this.gRange.get('dateRangeStart').setValue(new Date(this.firstClosingDate))
    this.gRange.get('dateRangeEnd').setValue(new Date(this.firstClosingDate))
    await this.submitQuery();
      this.CommonDialogsService.confirmDialog('Closing date: '+new Date(this.firstClosingDate).toDateString() ).subscribe(action => {
        if (action.isConfirmed===true) {
        this.dataSource.data = this.dataSource.data.filter(elem=>
          new Date(elem.dateBalance).toDateString()===this.firstClosingDate.toDateString() && elem.OutGoingBalance<0
        )
        if (this.dataSource.data.length) {
          if (overdraftOverride) {
              this.CommonDialogsService.confirmDialog('Close balance with overdrafts').subscribe(overdraftsConfimed => {
                overdraftsConfimed.isConfirmed? this.executeClosingBalance() : null;
              })
          } else {
            let result = {
              name:'error',
              detail:'Accounts with overdrafts. Balance has not been closed'
            }
            this.CommonDialogsService.snackResultHandler (result,'none')
          } 
        }
        else {this.executeClosingBalance()}
      }
    })
  } 
  executeClosingBalance () {
    this.AccountingDataService.accountingBalanceCloseInsert ({'closingDate' : new Date(this.firstClosingDate).toDateString()}).subscribe ((result) =>{ 
      result['name']!=='error'? result['detail']=result[0]['rows_affected']:null;
      this.updateResultHandler(result,'Balance was closed for '+ new Date(this.firstClosingDate).toDateString()+ '. Created rows',false, 7000,true)
    })
  }
  async checkBalance (dateBalance: string,showSnackMsg=true) {
    this.totalPassive = 0;
    this.totalActive = 0;
    this.totalDebit = 0;
    this.searchParametersFG.reset();
    this.accounts=[];
    this.gRange.get('dateRangeStart').setValue(new Date(dateBalance));  
    this.gRange.get('dateRangeEnd').setValue(new Date(dateBalance));
     await this.submitQuery(showSnackMsg);
     this.gRange.get('dateRangeStart').setValue(null);  
     this.gRange.get('dateRangeEnd').setValue(null);
     this.AccountingDataService.GetbAccountingSumTransactionPerDate(dateBalance,'SumTransactionPerDate').subscribe ((totalTransaction) => this.entriesTotal = totalTransaction[0].amountTransaction)
     this.dataSource.data.forEach ((el) => {
      this.totalDebit += Number(el.totalDebit);
      Number(el['xacttypecode']) == 1 ? this.totalPassive = this.totalPassive + Number(el.OutGoingBalance): this.totalActive =this.totalActive + Number(el.OutGoingBalance);
     })
  }
  openBalance () {
    this.CommonDialogsService.confirmDialog('Open date: ' + new Date(this.LastClosedDate).toLocaleDateString() ).subscribe(action => {
      if (action.isConfirmed===true) {
        this.AccountingDataService.accountingBalanceDayOpen({'dateToOpen' : new Date(this.LastClosedDate).toLocaleDateString()}).subscribe(
          result => {
          result['name']!=='error'? result['detail']=result[0]['rows_affected']:null;
          this.updateResultHandler(result, 'Operational day ' + new Date(this.LastClosedDate).toLocaleDateString()+ ' has been opened. Deleted rows ', false, 7000,false,true)
        })
      }
    })
  }
  balanceDeepCheck (dataToCheck:Date, firstDayOfCalculation: Date) {
    this.entriesTotal = 0;
    this.totalDebit = 0;
    this.AccountingDataService.GetDeepBalanceCheck(new Date(dataToCheck).toDateString(),new Date(firstDayOfCalculation).toDateString(),'GetDeepBalanceCheck').subscribe((balanceDataToReconcile) => {
      this.dataSource  = new MatTableDataSource(balanceDataToReconcile);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      balanceDataToReconcile.forEach ( (el) => {
        new Date(el['dateBalance']).toISOString() ===new Date(firstDayOfCalculation).toISOString() ? this.entriesTotal += Number(el.OutGoingBalance): this.totalDebit += Number(el.OutGoingBalance)
      });
    })
  }
  showEntries (row : any) {
    this.dialogShowEntriesList = this.dialog.open(AppTableAccEntriesComponent ,{minHeight:'600px', minWidth:'1700px', autoFocus: false, maxHeight: '90vh'});
    this.dialogShowEntriesList.componentInstance.paramRowData = row; 
    this.dialogShowEntriesList.componentInstance.UI_min = true; 
    this.dialogShowEntriesList.componentInstance.action = 'ShowEntriesForBalanceSheet';
    this.dialogShowEntriesList.componentInstance.modal_principal_parent.subscribe (()=>this.dialogChooseAccountsList.close());
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
  dateClass: MatCalendarCellClassFunction<Date> = (cellDate, view) => {
    const index = this.balacedDateWithEntries.findIndex(x => new Date(x).toLocaleDateString() == cellDate['_d'].toLocaleDateString());
    return (index > -1)? 'date-highlighted' : '';
  };
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
    event.target.textContent.trim() === 'ClearAll'? this.accounts = ['ClearAll']: null;
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
    const fileName = "balancesData.xlsx";
    let data = this.dataSource.data.map( (row,ind) =>({
      'accountId': Number(row.accountId),
      'accountNo' : row.accountNo,
      'dateBalance' : new Date (row.dateBalance),
      'openingBalance': Number(row.openingBalance),
      'totalDebit': Number(row.totalDebit),
      'totalCredit': Number(row.totalCredit),
      'outBalance' : Number(row.OutGoingBalance),
      'xacttypecode': (row.accountType)
    }))
    this.HandlingCommonTasksS.exportToExcel (data,"balancesData")
  }
  get  gRange () {return this.searchParametersFG.get('dataRange') } 
  get  entryTypes () {return this.searchParametersFG.get('entryType') } 
  
}