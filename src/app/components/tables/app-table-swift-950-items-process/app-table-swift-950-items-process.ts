import {AfterViewInit, Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import { firstValueFrom, lastValueFrom, Subscription } from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {TreeMenuSevice } from 'src/app/services/tree-menu.service';
import { bcParametersSchemeAccTrans, bcTransactionType_Ext, SWIFTStatement950model } from 'src/app/models/accounts-table-model';
import { AppAccountingService } from 'src/app/services/app-accounting.service';
import { AppAccEntryModifyFormComponent } from '../../forms/app-acc-entry-modify-form/app-acc-entry-modify-form';
import { HandlingTableSelectionService } from 'src/app/services/handling-table-selection.service';
import { SelectionModel } from '@angular/cdk/collections';
@Component({
  selector: 'app-table-swift-950-items-process',
  templateUrl: './app-table-swift-950-items-process.html',
  styleUrls: ['./app-table-swift-950-items-process.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class AppTableSWIFT950ItemsComponent  implements  AfterViewInit {
  bcEntryParameters = <bcParametersSchemeAccTrans> {}
  TransactionTypes: bcTransactionType_Ext[] = [];
  columnsToDisplay = ['select','id', 'amountTransaction',  'typeTransaction', 'valueDate', 'comment', 'refTransaction', 'entriesAmount' ];
  columnsHeaderToDisplay = ['Id', 'amount',  'type', 'value', 'comment','ref','allocated'];
  columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
  dataSource: MatTableDataSource<SWIFTStatement950model>;
  @Input() parentMsgRow: any;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(AppAccEntryModifyFormComponent) EntryModifyForm: AppAccEntryModifyFormComponent;
  @Output() public modal_principal_parent = new EventEmitter();
  expandedElement: SWIFTStatement950model  | null;
  accessToClientData: string = 'true';
  action ='';
  panelDraftOpenState:boolean = false;
  panelEntryListOpenState:boolean = false;
  selection = new SelectionModel<SWIFTStatement950model>(true, []);
  public multiSelect: boolean = true; 

  constructor ( 
    private AccountingDataService:AppAccountingService, 
    private TreeMenuSevice:TreeMenuSevice, 
    private SelectionService:HandlingTableSelectionService,
  ) {
    this.AccountingDataService.getReloadEntryList().subscribe (entryData =>{
      this.reloadSwiftItemsTable()})
  }
  
  async ngAfterViewInit() {
    this.columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
    let userData = JSON.parse(localStorage.getItem('userInfo'))
    await lastValueFrom (this.TreeMenuSevice.getaccessRestriction (userData.user.accessrole, 'accessToClientData'))
    .then (accessRestrictionData => this.reloadSwiftItemsTable())
  }
  
  reloadSwiftItemsTable () {
    this.AccountingDataService.GetMT950Transactions (null,this.parentMsgRow.id,null,null,'GetMT950Transactions').subscribe (MT950Transactions  => {
      this.dataSource  = new MatTableDataSource(MT950Transactions);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      console.log('reloadSwiftItemsTable for parent',this.parentMsgRow.id);
      this.AccountingDataService.sendLoadedMT950Transactions(this.parentMsgRow.id)
    })
  }
  async openEntry (row) {
    if (Number(row.entriesAmount) > Number(row.amountTransaction)) {
      let EmptyEntry = {'entryDraft' : {}, 'formStateisDisabled': true}
      this.AccountingDataService.sendEntryDraft(EmptyEntry);
    } else {
      let accountNo = row.comment.split('/')[3];
      await lastValueFrom (this.AccountingDataService.GetAccountData(0,0,0, accountNo,'GetAccountData'))
      .then ((accountData) => {
        this.bcEntryParameters.pAccountId = Number(accountData[0].accountId);
        // this.bcEntryParameters.dAccountNo = accountData[0].accountNo;
        this.bcEntryParameters.pLedgerNoId = this.parentMsgRow.ledgerNoId;
        // this.bcEntryParameters.dLedgerNo = this.parentMsgRow.ledgerNo;
        this.bcEntryParameters.pExtTransactionId = row.id;
        this.bcEntryParameters.pAmount = row.amountTransaction;
        this.bcEntryParameters.pDate_T = row.valueDate ;
        this.bcEntryParameters.pSenderBIC = this.parentMsgRow.senderBIC;
        this.bcEntryParameters.pRef = row.refTransaction;
        this.bcEntryParameters.cxActTypeCode = row.typeTransaction;
        this.bcEntryParameters.cxActTypeCode_Ext = row.comment.split('/')[1];
        this.bcEntryParameters.cLedgerType = 'NostroAccount';
        this.AccountingDataService.GetEntryScheme (this.bcEntryParameters).subscribe (entryScheme => {
          // console.log('Manual 950 sent sendEntryDraft',entryScheme);
        this.AccountingDataService.sendEntryDraft({'entryDraft' : entryScheme, 'formStateisDisabled': false, 'refTransaction': row.refTransaction});
        });
      })
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage();}
  }
  isAllSelected() { return this.SelectionService.isAllSelected(this.dataSource, this.selection)} 
  toggleAllRows() { 
    return this.SelectionService.toggleAllRows(this.dataSource, this.selection)} 
  checkboxLabel(row?: SWIFTStatement950model): string {return this.SelectionService.checkboxLabel(this.dataSource, this.selection, row)}

}