import { Component, EventEmitter, Output, ViewChild} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {lastValueFrom, Subscription } from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {TreeMenuSevice } from 'src/app/services/tree-menu.service';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { bLedgerAccounts } from 'src/app/models/intefaces';
import { AppAccountingService } from 'src/app/services/app-accounting.service';
import { AppAccAccountModifyFormComponent } from '../../forms/acc-account-form/acc-account-form';
import { HandlingCommonTasksService } from 'src/app/services/handling-common-tasks.service';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { formatNumber } from '@angular/common';
@Component({
  selector: 'app-table-acc-ledger-accounts',
  templateUrl: './acc-accounts-ledger-table.html',
  styleUrls: ['./acc-accounts-ledger-table.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class AppTableAccLedgerAccountsComponent {
  columnsToDisplay = [
    'ledgerNo',  
    'd_APTypeCodeAccount', 
    'name',
    'd_Client',
    'externalAccountNo',
    'd_Account_Type',
    'ledgerNoTrade',  
  ]
  columnsHeaderToDisplay = [
    'No',
    'Balance',
    'Details', 
    'Client',  
    'external No', 
    'Type', 
    'Trade', 
  ];
  columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
  dataSource: MatTableDataSource<bLedgerAccounts>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @Output() public modal_principal_parent = new EventEmitter();
  expandedElement: bLedgerAccounts  | null;
  public selectedRow : bLedgerAccounts  | null;
  accessToClientData: string = 'true';
  public readOnly: boolean = false; 
  action ='GetLedgerAccountsDataWholeList';
  dialogRef: MatDialogRef<AppAccAccountModifyFormComponent>;
  constructor(    
    private AccountingDataService:AppAccountingService, 
    private CommonDialogsService:HadlingCommonDialogsService,
    private TreeMenuSevice:TreeMenuSevice, 
    private dialog: MatDialog ,
    private HandlingCommonTasksS:HandlingCommonTasksService 
  ) {
    this.AccountingDataService.getReloadAccontList().subscribe ( (id) => this.updateAccountsData(this.action));
    this.updateAccountsData(this.action);
  }
  async updateAccountsData (action: string) {
    return new Promise<number> (async (resolve,reject) => {
    let userData = JSON.parse(localStorage.getItem('userInfo'))
    await lastValueFrom (this.TreeMenuSevice.getaccessRestriction (userData.user.accessrole, 'accessToClientData')).then ((accessRestrictionData) =>{
      this.dataSource? this.dataSource.data=null : null;
      this.accessToClientData = accessRestrictionData['elementvalue']
      this.AccountingDataService.GetLedgerAccountsListAccounting (null,null,null,null,this.action).subscribe (AccountsList  => {
        this.dataSource  = new MatTableDataSource(AccountsList);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        resolve (AccountsList.length)
      })
    })
  })
  }
  async submitQuery () {
    await this.updateAccountsData(this.action).then ((rowsCount) => {
      this.CommonDialogsService.snackResultHandler({name:'success',detail: formatNumber (rowsCount,'en-US') + ' rows loaded'})
    })
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage();}
  }
  clearFilter (input:HTMLInputElement) {
    input.value=''
    this.dataSource.filter = ''
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage()}
  }
  chooseAccount (element) {
    this.selectedRow = element;
    this.modal_principal_parent.emit('CLOSE_PARENT_MODAL');
  }
  openAccountModifyForm (actionType:string, row: any ) {
    console.log('row', row);
    this.dialogRef = this.dialog.open(AppAccAccountModifyFormComponent ,{minHeight:'400px', maxWidth:'1000px' });
    this.dialogRef.componentInstance.action = actionType;
    this.dialogRef.componentInstance.title = actionType;
    this.dialogRef.componentInstance.data = row;
    this.dialogRef.componentInstance.aType = 1;
    switch (actionType) {
      case 'Create':
      case 'Create_Example': 
      this.dialogRef.componentInstance.title = 'Create New';
      break;
    }
  }
  exportToExcel ()  {
    this.HandlingCommonTasksS.exportToExcel (this.dataSource.data,"accountLedgerData")
  }  
}