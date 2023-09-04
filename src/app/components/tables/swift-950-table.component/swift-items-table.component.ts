import {AfterViewInit, Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {bcParametersSchemeAccTrans, bcTransactionType_Ext, SWIFTStatement950model } from 'src/app/models/intefaces.model';
import {AppAccountingService } from 'src/app/services/accounting.service';
import {AppAccEntryModifyFormComponent } from '../../forms/acc-entry-form.component/acc-entry-form.component';
import {HandlingTableSelectionService } from 'src/app/services/handling-table-selection.service';
import {SelectionModel } from '@angular/cdk/collections';
import {AuthService } from 'src/app/services/auth.service';
@Component({
  selector: 'app-table-swift-items',
  templateUrl: './swift-items-table.component.html',
  styleUrls: ['./swift-items-table.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class AppTableSWIFT950ItemsComponent  implements  AfterViewInit {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  bcEntryParameters = <bcParametersSchemeAccTrans> {}
  TransactionTypes: bcTransactionType_Ext[] = [];
  columnsToDisplay = ['select','id', 'amountTransaction',  'typeTransaction', 'valueDate', 'comment', 'refTransaction', 'entriesAmount' ];
  columnsHeaderToDisplay = ['Id', 'amount',  'type', 'value', 'comment','ref','allocated'];
  columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
  dataSource: MatTableDataSource<SWIFTStatement950model>;
  @Input() parentMsgRow: any;
  @Input() FirstOpenedAccountingDate: Date;
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
    private SelectionService:HandlingTableSelectionService,
    private AuthServiceS:AuthService,  
  ) {
    this.AccountingDataService.getLoadedMT950Transactions().subscribe (swiftsIDs => swiftsIDs.includes (this.parentMsgRow.id)? this.reloadSwiftItemsTable() : null)
  }
  ngAfterViewInit() {
    this.columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
    this.accessToClientData = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToClientData')[0].elementvalue;
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToSWIFTData')[0].elementvalue;
    this.disabledControlElements = this.accessState === 'full'? false : true;
    this.reloadSwiftItemsTable()
  }
  reloadSwiftItemsTable () {
    this.accessState ==='none'? null : this.AccountingDataService.GetMT950Transactions (null,this.parentMsgRow.id,null,null,'GetMT950Transactions').subscribe (MT950Transactions  => {
      this.dataSource? this.dataSource.data = null : null;
      this.dataSource  = new MatTableDataSource(MT950Transactions);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      console.log('reloadSwiftItemsTable for parent',this.parentMsgRow.id);
    })
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage();}
  }
  isAllSelected() { return this.SelectionService.isAllSelected(this.dataSource, this.selection)} 
  toggleAllRows(forceSelectAll:boolean=false) { return this.SelectionService.toggleAllRows(this.dataSource, this.selection,forceSelectAll)} 
  checkboxLabel(row?: SWIFTStatement950model): string {return this.SelectionService.checkboxLabel(this.dataSource, this.selection, row)}
  changeAllocatedSum(data: { swift_item_id: number; allocated_sum: number; }) {
    this.dataSource.data.filter(el => el.id === data.swift_item_id)[0].entriesAmount=Number(data.allocated_sum)
  }
}