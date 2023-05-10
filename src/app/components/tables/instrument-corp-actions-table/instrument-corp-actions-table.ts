import {AfterViewInit, Component, ViewEncapsulation, EventEmitter, Output, ViewChild, Input} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {Subscription } from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {animate, state, style, transition, trigger} from '@angular/animations';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { instrumentCorpActions, marketDataSources } from 'src/app/models/accounts-table-model';
import { FormControl, FormGroup} from '@angular/forms';
import * as XLSX from 'xlsx'
import { AppMarketDataService } from 'src/app/services/app-market-data.service';
@Component({
  selector: 'app-table-inst-corp-actions',
  templateUrl: './instrument-corp-actions-table.html',
  styleUrls: ['./instrument-corp-actions-table.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class AppTableCorporateActionsComponent  implements AfterViewInit {
  columnsToDisplay = ['date', 'isin','actiontype','unredemeedvalue','couponrate','couponamount', 'notinal', 'notinalcurrency', 'issuevolume', 'action'];
  columnsHeaderToDisplay = ['date','isin','type','unredemeed','rate','coupon amount', 'notinal', 'notinal currency', 'issue volume','action' ];
  columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];

  dataSource: MatTableDataSource<instrumentCorpActions>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @Output() public modal_principal_parent = new EventEmitter();
  
  panelOpenStateSecond = false;
  instruments: string[] = ['ClearAll'];
  searchParametersFG: FormGroup;
  @Input () coprData:instrumentCorpActions[] = [];
  @Input () isin:string;

  constructor(
    private MarketDataService: AppMarketDataService,
    private dialog: MatDialog,
  ) {
    this.MarketDataService.getCorpActionData().subscribe(corpActionData => this.updateInstrumentDataTable(corpActionData))
  }
  async ngAfterViewInit() {
    this.dataSource? null : this.MarketDataService.getInstrumentDataCorpActions().subscribe(data=>this.updateInstrumentDataTable(data));
  }
  openCorpActionForm (elem:instrumentCorpActions, action:string) {
 /*    this.dialogInstrumentModify = this.dialog.open (AppInvInstrumentModifyFormComponent,{minHeight:'600px', minWidth:'1300px', autoFocus: false, maxHeight: '90vh'})
    this.dialogInstrumentModify.componentInstance.action = action; */
    // this.dialogInstrumentModify.componentInstance.data = element;
  }
  updateInstrumentDataTable (corpActionData:instrumentCorpActions[]) {
    this.dataSource  = new MatTableDataSource(corpActionData);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.isin? this.dataSource.filter=this.isin : null;

  }
  applyFilter(event: any, col?:string) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage();}
  }
  clearFilter (fFormControl : FormControl) {
    fFormControl.patchValue('')
    this.dataSource.filter = ''
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage()}
  }
  exportToExcel() {
    const fileName = "corpActionsData.xlsx";
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.dataSource.data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "corpActionsData");
    XLSX.writeFile(wb, fileName);
  }
  get  marketSource () {return this.searchParametersFG.get('marketSource') } 
  get  boards () {return this.searchParametersFG.get('boards') } 
  get  secidList () {return this.searchParametersFG.get('secidList') } 
}