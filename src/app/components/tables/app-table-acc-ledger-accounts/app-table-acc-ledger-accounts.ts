import {AfterViewInit, Component, EventEmitter, Output, ViewChild} from '@angular/core';
import {MatLegacyPaginator as MatPaginator} from '@angular/material/legacy-paginator';
import {MatSort} from '@angular/material/sort';
import {lastValueFrom, Subscription } from 'rxjs';
import {MatLegacyTableDataSource as MatTableDataSource} from '@angular/material/legacy-table';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {TreeMenuSevice } from 'src/app/services/tree-menu.service';
import { MatLegacyDialog as MatDialog, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import { bAccounts, bLedgerAccounts } from 'src/app/models/accounts-table-model';
import { AppAccountingService } from 'src/app/services/app-accounting.service';
import { AppAccEntryModifyFormComponent } from '../../forms/app-acc-entry-modify-form/app-acc-entry-modify-form';
import { AppAccAccountModifyFormComponent } from '../../forms/app-acc-account-modify-form/app-acc-account-modify-form ';
@Component({
  selector: 'app-table-acc-ledger-accounts',
  templateUrl: './app-table-acc-ledger-accounts.html',
  styleUrls: ['./app-table-acc-ledger-accounts.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class AppTableAccLedgerAccountsComponent  implements AfterViewInit {
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
  action ='';
  dialogRef: MatDialogRef<AppAccAccountModifyFormComponent>;
  private subscriptionName: Subscription;


  constructor(private AccountingDataService:AppAccountingService, private TreeMenuSevice:TreeMenuSevice, private dialog: MatDialog ) {
    this.subscriptionName= this.AccountingDataService.getReloadAccontList().subscribe ( (id) => {
      this.AccountingDataService.GetLedgerAccountsListAccounting (null,null,null,null,'GetLedgerAccountsDataWholeList').subscribe (AccountsList  => {
        this.dataSource  = new MatTableDataSource(AccountsList);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      })
    } )
  }

  async ngAfterViewInit() {
    this.columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
    let userData = JSON.parse(localStorage.getItem('userInfo'))
    await lastValueFrom (this.TreeMenuSevice.getaccessRestriction (userData.user.accessrole, 'accessToClientData'))
    .then ((accessRestrictionData) =>{
      this.accessToClientData = accessRestrictionData['elementvalue']
      this.AccountingDataService.GetLedgerAccountsListAccounting (null,null,null,null,'GetLedgerAccountsDataWholeList').subscribe (LedgerAccountsList  => {
        this.dataSource  = new MatTableDataSource(LedgerAccountsList);
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
}