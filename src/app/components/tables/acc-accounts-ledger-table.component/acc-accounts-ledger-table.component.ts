import { Component, EventEmitter, Output, ViewChild} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {animate, state, style, transition, trigger} from '@angular/animations';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { bLedgerAccounts } from 'src/app/models/intefaces';
import { AppAccountingService } from 'src/app/services/app-accounting.service';
import { AppAccAccountModifyFormComponent } from '../../forms/acc-account-form/acc-account-form';
import { HandlingCommonTasksService } from 'src/app/services/handling-common-tasks.service';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { formatNumber } from '@angular/common';
import { AuthService } from 'src/app/services/auth.service';
import { investmentNodeColor } from 'src/app/models/constants';

@Component({
  selector: 'app-table-acc-ledger-accounts',
  templateUrl: './acc-accounts-ledger-table.component.html',
  styleUrls: ['./acc-accounts-ledger-table.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class AppTableAccLedgerAccountsComponent {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  columnsToDisplay = ['ledgerNo','d_APTypeCodeAccount', 'name','d_Client', 'externalAccountNo','d_Account_Type','ledgerNoTrade', 'action']
  columnsHeaderToDisplay = ['No','Balance','Details','Client', 'external No','Type','Trade','Action'];
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
  investmentNodeColor = investmentNodeColor
  constructor(    
    private AccountingDataService:AppAccountingService, 
    private CommonDialogsService:HadlingCommonDialogsService,
    private AuthServiceS:AuthService,  
    private dialog: MatDialog ,
    private HandlingCommonTasksS:HandlingCommonTasksService 
  ) {
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToBalanceData')[0].elementvalue;
    this.disabledControlElements = this.accessState === 'full'? false : true; 
    this.accessState !=='none'? this.AccountingDataService.getReloadLedgerAccontList().subscribe (id => this.updateAccountsData(this.action)):null;
  }
  ngOnInit(): void {
    this.updateAccountsData(this.action)
  }
  async updateAccountsData (action: string) {
    console.log('Reload Ledger');
    
    return new Promise<number> (async (resolve) => {
      this.dataSource? this.dataSource.data=null : null;
      this.AccountingDataService.GetLedgerAccountsListAccounting (null,null,null,null,this.action).subscribe (AccountsList  => {
        this.dataSource  = new MatTableDataSource(AccountsList);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        resolve (AccountsList.length)
      })
    })
  }
  async submitQuery () {
    this.dataSource.data = null;
    await this.updateAccountsData(this.action).then (rowsCount =>this.CommonDialogsService.snackResultHandler({name:'success',detail: formatNumber (rowsCount,'en-US') + ' rows'}, ' Loaded'))
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
    this.dialogRef = this.dialog.open(AppAccAccountModifyFormComponent ,{minHeight:'400px', maxWidth:'1000px' });
    this.dialogRef.componentInstance.action = actionType;
    this.dialogRef.componentInstance.data = row;
    this.dialogRef.componentInstance.aType = 1;
  }
  exportToExcel ()  {
    this.HandlingCommonTasksS.exportToExcel (this.dataSource.data,"accountLedgerData")
  }  
}