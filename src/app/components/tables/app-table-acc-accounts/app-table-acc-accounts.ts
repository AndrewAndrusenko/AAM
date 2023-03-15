import {AfterViewInit, Component, EventEmitter, Output, ViewChild} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {lastValueFrom, Subscription } from 'rxjs';
import {MatTableDataSource} from '@angular/material/table';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {TreeMenuSevice } from 'src/app/services/tree-menu.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { bAccounts, bAccountsEntriesList } from 'src/app/models/accounts-table-model';
import { AppAccountingService } from 'src/app/services/app-accounting.service';
import { AppAccAccountModifyFormComponent } from '../../forms/app-acc-account-modify-form/app-acc-account-modify-form ';
@Component({
  selector: 'app-table-acc-accounts',
  templateUrl: './app-table-acc-accounts.html',
  styleUrls: ['./app-table-acc-accounts.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class AppTableAccAccountsComponent  implements AfterViewInit {
  columnsToDisplay = [
    'accountNo',  
    'd_acctypedescription',  
    'Information',  
    'd_clientname',
    'd_portfolioCode',
    'd_entitytypedescription', 
  ]
  columnsHeaderToDisplay = [
    'No',
    'Type',
    'Details', 
    'Client',  
    'Portfolio', 
    'Entit yType', 
  ];
  private subscriptionName: Subscription;
  columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
  dataSource: MatTableDataSource<bAccounts>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @Output() public modal_principal_parent = new EventEmitter();
  public readOnly: boolean = false; 
  public selectedRow: bAccounts  | null;
  expandedElement: bAccounts  | null;
  accessToClientData: string = 'true';
  action ='';
  dialogRef: MatDialogRef<AppAccAccountModifyFormComponent>;
  

  constructor(private AccountingDataService:AppAccountingService, private TreeMenuSevice:TreeMenuSevice, private dialog: MatDialog ) {
      
    this.subscriptionName= this.AccountingDataService.getReloadAccontList().subscribe ( (id) => {
      this.AccountingDataService.GetAccountsListAccounting (null,null,null,null,'GetAccountDataWholeList').subscribe (AccountsList  => {
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
      this.AccountingDataService.GetAccountsListAccounting (null,null,null,null,'GetAccountDataWholeList').subscribe (AccountsList  => {
        this.dataSource  = new MatTableDataSource(AccountsList);
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
    // this.dialogRef.componentInstance.accountType = 'Account';

    this.dialogRef.componentInstance.data = row;
    switch (actionType) {
      case 'Create':
      case 'Create_Example': 
      this.dialogRef.componentInstance.title = 'Create New';
      break;
    }
  }
}