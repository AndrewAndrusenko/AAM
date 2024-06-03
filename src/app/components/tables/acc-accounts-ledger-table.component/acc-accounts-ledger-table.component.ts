import { Component, EventEmitter, Output, ViewChild} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import {bLedger, bLedgerAccounts } from 'src/app/models/accountng-intefaces.model';
import {AppAccountingService } from 'src/app/services/accounting.service';
import {AppAccAccountModifyFormComponent } from '../../forms/acc-account-form.component/acc-account-form.component';
import {HandlingCommonTasksService } from 'src/app/services/handling-common-tasks.service';
import {HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import {formatNumber } from '@angular/common';
import {AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-table-acc-ledger-accounts',
  templateUrl: './acc-accounts-ledger-table.component.html',
  styleUrls: ['./acc-accounts-ledger-table.component.scss'],
})
export class AppTableAccLedgerAccountsComponent {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  columnsToDisplay = ['ledgerNo','d_APTypeCodeAccount', 'name','d_Client', 'externalAccountNo','d_Account_Type','ledgerNoTrade', 'action']
  columnsHeaderToDisplay = ['No','Balance','Details','Client', 'external No','Type','Trade','Action'];
  dataSource: MatTableDataSource<bLedgerAccounts>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @Output() public modal_principal_parent: EventEmitter <{id:number,accountNo:string}>;
  expandedElement: bLedgerAccounts  | null;
  public selectedRow : bLedgerAccounts  | null;
  accessToClientData: string = 'true';
  public readOnly: boolean = false; 
  action ='GetLedgerAccountsDataWholeList';
  dialogRef: MatDialogRef<AppAccAccountModifyFormComponent>;
  constructor(    
    private AccountingDataService:AppAccountingService, 
    private CommonDialogsService:HadlingCommonDialogsService,
    private AuthServiceS:AuthService,  
    private dialog: MatDialog ,
    private HandlingCommonTasksS:HandlingCommonTasksService 
  ) {
    this.modal_principal_parent = new EventEmitter()
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToBalanceData')[0].elementvalue;
    this.disabledControlElements = this.accessState === 'full'? false : true; 
    this.accessState !=='none'? this.AccountingDataService.getReloadLedgerAccontList().subscribe (id => this.updateAccountsData(this.action)):null;
    this.updateAccountsData(this.action)

  }
  updateAccountsData (action: string,snak:boolean=false) {
    this.dataSource? this.dataSource.data=null : null;
    this.AccountingDataService.GetLedgerAccountsListAccounting (null,null,null,null,action).subscribe (AccountsList  => {
      this.dataSource  = new MatTableDataSource(AccountsList);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      snak? this.CommonDialogsService.snackResultHandler({name:'success',detail: formatNumber (AccountsList.length,'en-US') + ' rows'}, ' Loaded'):null;
    })
  }
  applyFilter(event: KeyboardEvent) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage();}
  }
  clearFilter (input:HTMLInputElement) {
    input.value=''
    this.dataSource.filter = ''
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage()}
  }
  chooseAccount (element:bLedgerAccounts) {
    this.selectedRow = element;
    this.modal_principal_parent.emit({id:Number(element.ledgerNoId),accountNo:element.ledgerNo});
  }
  openAccountModifyForm (actionType:string, row: bLedger ) {
    this.dialogRef = this.dialog.open(AppAccAccountModifyFormComponent ,{minHeight:'400px', maxWidth:'1000px' });
    this.dialogRef.componentInstance.action = actionType;
    this.dialogRef.componentInstance.data = row;
    this.dialogRef.componentInstance.aType = 1;
  }
  exportToExcel ()  {
    this.HandlingCommonTasksS.exportToExcel (this.dataSource.data,"accountLedgerData")
  }  
}