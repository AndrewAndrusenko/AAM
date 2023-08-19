import {Component, EventEmitter, OnInit, Output, ViewChild} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {animate, state, style, transition, trigger} from '@angular/animations';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { bAccounts } from 'src/app/models/intefaces.model';
import { AppAccountingService } from 'src/app/services/accounting.service';
import { AppAccAccountModifyFormComponent } from '../../forms/acc-account-form.component/acc-account-form.component';
import { SelectionModel } from '@angular/cdk/collections';
import { MatChipInputEvent } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { formatNumber } from '@angular/common';
import { HandlingCommonTasksService } from 'src/app/services/handling-common-tasks.service';
import { AuthService } from 'src/app/services/auth.service';
import { investmentNodeColor } from 'src/app/models/constants.model';
import { HandlingTableSelectionService } from 'src/app/services/handling-table-selection.service';

@Component({
  selector: 'app-table-acc-accounts',
  templateUrl: './acc-accounts-table.component.html',
  styleUrls: ['./acc-accounts-table.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class AppTableAccAccountsComponent  implements OnInit {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  columnsToDisplay = ['select','accountNo','d_APTypeCodeAccount','d_Account_Type','Information','d_clientname','d_portfolioCode', 'd_entitytypedescription', 'action']
  columnsHeaderToDisplay = ['No','Balance','Type','Details','Client','Portfolio','Entity','Action' ];
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
  ;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  investmentNodeColor=investmentNodeColor;
  constructor(
    private AccountingDataService:AppAccountingService, 
    private CommonDialogsService:HadlingCommonDialogsService,
    private AuthServiceS:AuthService,  
    private SelectionService:HandlingTableSelectionService,
    private dialog: MatDialog ,
    private HandlingCommonTasksS:HandlingCommonTasksService
  ) {   
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToBalanceData')[0].elementvalue;
    this.disabledControlElements = this.accessState === 'full'? false : true; 
    this.accessState !=='none'? this.AccountingDataService.getReloadAccontList().subscribe (id => this.updateAccountsData(this.action)):null;
  }
  async updateAccountsData (action: string) {
    console.log('Reload Account');

    return new Promise<number> (async (resolve) => {
      this.dataSource? this.dataSource.data=null : null;
      this.AccountingDataService.GetAccountsListAccounting (null,null,null,null,this.action).subscribe (AccountsList  => {
        this.dataSource  = new MatTableDataSource(AccountsList);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        resolve (AccountsList.length)
      })
    })
  }
  ngOnInit(): void {
    this.updateAccountsData(this.action)
  }
  async submitQuery () {
    this.dataSource.data=null;
    await this.updateAccountsData(this.action).then (rowsCount => this.CommonDialogsService.snackResultHandler({name:'success',detail: formatNumber (rowsCount,'en-US') + ' rows'},'Loaded '))
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