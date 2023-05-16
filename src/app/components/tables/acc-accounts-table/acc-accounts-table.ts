import {Component, EventEmitter, OnInit, Output, ViewChild} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {lastValueFrom } from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {TreeMenuSevice } from 'src/app/services/tree-menu.service';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { bAccounts } from 'src/app/models/intefaces';
import { AppAccountingService } from 'src/app/services/app-accounting.service';
import { AppAccAccountModifyFormComponent } from '../../forms/acc-account-form/acc-account-form';
import { SelectionModel } from '@angular/cdk/collections';
import { MatChipInputEvent } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { formatNumber } from '@angular/common';
import { HandlingCommonTasksService } from 'src/app/services/handling-common-tasks.service';

@Component({
  selector: 'app-table-acc-accounts',
  templateUrl: './acc-accounts-table.html',
  styleUrls: ['./acc-accounts-table.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class AppTableAccAccountsComponent  implements OnInit {
  columnsToDisplay = [
    'select',
    'accountNo',  
    'd_APTypeCodeAccount',
    'd_Account_Type',  
    'Information',  
    'd_clientname',
    'd_portfolioCode',
    'd_entitytypedescription', 
  ]
  columnsHeaderToDisplay = [
    'No',
    'Balance',
    'Type',
    'Details', 
    'Client',  
    'Portfolio', 
    'Entity', 
  ];
  columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
  dataSource: MatTableDataSource<bAccounts>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @Output() public modal_principal_parent = new EventEmitter();
  public readOnly: boolean = false; 
  public multiSelect: boolean = false; 
  
  public selectedRow: bAccounts  | null;
  expandedElement: bAccounts  | null;
  accessToClientData: string = 'true';
  action ='GetAccountDataWholeList';
  dialogRef: MatDialogRef<AppAccAccountModifyFormComponent>;
 
  selection = new SelectionModel<bAccounts>(true, []);
  accounts: string[] = [];
  addOnBlur = true;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  constructor(
    private AccountingDataService:AppAccountingService, 
    private CommonDialogsService:HadlingCommonDialogsService,
    private TreeMenuSevice:TreeMenuSevice, 
    private dialog: MatDialog ,
    private HandlingCommonTasksS:HandlingCommonTasksService
  ) {
    this.AccountingDataService.getReloadAccontList().subscribe ( (id) => {
      this.updateAccountsData(this.action)
    })
  }
  async updateAccountsData (action: string) {
    return new Promise<number> (async (resolve,reject) => {
    let userData = JSON.parse(localStorage.getItem('userInfo'))
    await lastValueFrom (this.TreeMenuSevice.getaccessRestriction (userData.user.accessrole, 'accessToClientData')).then ((accessRestrictionData) =>{
      this.dataSource? this.dataSource.data=null : null;
      this.accessToClientData = accessRestrictionData['elementvalue']
      this.AccountingDataService.GetAccountsListAccounting (null,null,null,null,this.action).subscribe (AccountsList  => {
        this.dataSource  = new MatTableDataSource(AccountsList);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        resolve (AccountsList.length)
      })
    })
  })
  }
  ngOnInit(): void {
    this.updateAccountsData(this.action)
  }
  async submitQuery () {
    await this.updateAccountsData(this.action).then ((rowsCount) => {
      this.CommonDialogsService.snackResultHandler({name:'success',detail: formatNumber (rowsCount,'en-US') + ' rows loaded'})
    })
  }
  exportToExcel () {
    this.HandlingCommonTasksS.exportToExcel (this.dataSource.data,"accountData")
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
   selectAccountsArray() {
    this.modal_principal_parent.emit('CLOSE_PARENT_MODAL');
  }
  openAccountModifyForm (actionType:string, row: any ) {
    this.dialogRef = this.dialog.open(AppAccAccountModifyFormComponent ,{minHeight:'400px', maxWidth:'1000px' });
    this.dialogRef.componentInstance.action = actionType;
    this.dialogRef.componentInstance.title = actionType;
    this.dialogRef.componentInstance.data = row;
    switch (actionType) {
      case 'Create':
      case 'Create_Example': 
        this.dialogRef.componentInstance.title = 'Create New';
      break;
      break;
      case 'View':
        this.dialogRef.componentInstance.accountModifyForm.disable()
      break;
    }
  }
  isAllSelected() {
    if (!this.dataSource) return false
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length||null;
    return numSelected === numRows;
  }
  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }
    this.selection.select(...this.dataSource.data);
  }
  checkboxLabel(row?: bAccounts): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${ 1}`;
  }
  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    (value)? this.accounts.push(value) : null;
    event.chipInput!.clear();
  }
  remove(account: string): void {
    const index = this.accounts.indexOf(account);
   (index >= 0)? this.accounts.splice(index, 1) : null
  }
  addChips (selection:SelectionModel<bAccounts>) { 
    this.accounts = selection.selected.map((accountRow) => {return accountRow['accountNo']}) 
    console.log('acc', this.accounts);
  }
}