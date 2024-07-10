import {Component, EventEmitter, Output, ViewChild} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import {bAccounts } from 'Frontend-Angular-Src/app/models/accountng-intefaces.model';
import {AppAccountingService } from 'Frontend-Angular-Src/app/services/accounting.service';
import {AppAccAccountModifyFormComponent } from '../../forms/acc-account-form.component/acc-account-form.component';
import {SelectionModel } from '@angular/cdk/collections';
import {MatChipInputEvent } from '@angular/material/chips';
import {COMMA, ENTER } from '@angular/cdk/keycodes';
import {HadlingCommonDialogsService } from 'Frontend-Angular-Src/app/services/hadling-common-dialogs.service';
import {formatNumber } from '@angular/common';
import {HandlingCommonTasksService } from 'Frontend-Angular-Src/app/services/handling-common-tasks.service';
import {AuthService } from 'Frontend-Angular-Src/app/services/auth.service';
import {HandlingTableSelectionService } from 'Frontend-Angular-Src/app/services/handling-table-selection.service';

@Component({
  selector: 'app-table-acc-accounts',
  templateUrl: './acc-accounts-table.component.html',
  styleUrls: ['./acc-accounts-table.component.scss'],
})
export class AppTableAccAccountsComponent {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  columnsToDisplay = ['select','accountId','accountNo','d_APTypeCodeAccount','d_Account_Type','Information','d_clientname','d_portfolioCode', 'd_entitytypedescription', 'action']
  columnsHeaderToDisplay = ['ID','No','Balance','Type','Details','Client','Portfolio','Entity','Action' ];
  dataSource: MatTableDataSource<bAccounts>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @Output() public modal_principal_parent: EventEmitter <{id:number,accountNo:string}>;
  public readOnly: boolean = false; 
  public multiSelect: boolean = false; 
  public selectedRow: bAccounts  | null;
  expandedElement: bAccounts  | null;
  accessToClientData: string = 'true';
  action ='GetAccountDataWholeList';
  dialogRef: MatDialogRef<AppAccAccountModifyFormComponent>;
  selection = new SelectionModel<bAccounts>(true, []);
  accounts: string[] = [];
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  constructor(
    private AccountingDataService:AppAccountingService, 
    private CommonDialogsService:HadlingCommonDialogsService,
    private AuthServiceS:AuthService,  
    private SelectionService:HandlingTableSelectionService,
    private dialog: MatDialog ,
    private HandlingCommonTasksS:HandlingCommonTasksService
  ) {  
    this.modal_principal_parent = new EventEmitter();
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToBalanceData')[0].elementvalue;
    this.disabledControlElements = this.accessState === 'full'? false : true; 
    this.accessState !=='none'? this.AccountingDataService.getReloadAccontList().subscribe (id => this.updateAccountsData(this.action)):null;
  }
  ngOnInit(): void {
    this.updateAccountsData(this.action)
  }
  updateAccountsData (action: string,snack:boolean=false) {
    this.dataSource? this.dataSource.data=null : null;
    this.AccountingDataService.GetAccountsListAccounting (null,null,null,null,action).subscribe (accountsList  => {
      this.dataSource  = new MatTableDataSource(accountsList);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      snack? this.CommonDialogsService.snackResultHandler({name:'success',detail: formatNumber (accountsList.length,'en-US') + ' rows'},'Loaded '):null;
    })
  }
  exportToExcel () {
    this.HandlingCommonTasksS.exportToExcel (this.dataSource.data,"accountData")
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
  chooseAccount (element:bAccounts) {
    this.selectedRow = element;
    this.modal_principal_parent.emit({id:element.accountId,accountNo:element.accountNo});
  }
   selectAccountsArray() {
    this.modal_principal_parent.emit({id:null,accountNo:''});
  }
  openAccountModifyForm (actionType:string, row: bAccounts ) {
    this.dialogRef = this.dialog.open(AppAccAccountModifyFormComponent ,{minHeight:'400px',minWidth:'40vw', maxWidth:'80vw', maxHeight: '90vh' });
    this.dialogRef.componentInstance.action = actionType;
    this.dialogRef.componentInstance.data = row;
  }
  isAllSelected() { return this.SelectionService.isAllSelected(this.dataSource, this.selection)} 
  toggleAllRows(forceSelectAll:boolean=false) { return this.SelectionService.toggleAllRows(this.dataSource, this.selection,forceSelectAll)} 
  checkboxLabel(row?: bAccounts): string {return this.SelectionService.checkboxLabel(this.dataSource, this.selection, row)}
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
  }
}