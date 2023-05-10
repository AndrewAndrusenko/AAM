import {AfterViewInit, Component, ViewEncapsulation, EventEmitter, Output, ViewChild, Input} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {animate, state, style, transition, trigger} from '@angular/animations';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { instrumentCorpActions, instrumentDetails, marketDataSources } from 'src/app/models/accounts-table-model';
import { FormControl, FormGroup} from '@angular/forms';
import { AppMarketDataService } from 'src/app/services/app-market-data.service';
@Component({
  selector: 'app-table-instrument-details',
  templateUrl: './instrument-details-table.html',
  styleUrls: ['./instrument-details-table.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class AppTableInstrumentDetailsComponent  implements AfterViewInit {
  columnsToDisplay = ['status','boardid', 'boardname', 'listlevel','issuesize','facevalue','matdate','regnumber', 'currencyid', 'lotsize', 'minstep', 'decimals','action' ];
  columnsHeaderToDisplay = ['status','boardid', 'boardname', 'listlevel','issuesize','facevalue','matdate','regnumber', 'currencyid', 'lotsize', 'minstep', 'decimals','action' ];
  dataSource: MatTableDataSource<instrumentDetails>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @Output() public modal_principal_parent = new EventEmitter();
  @Input () instrumentDetails:instrumentDetails[] = [];
  @Input () secid:string;
  panelOpenStateSecond = false;

  constructor(
    private MarketDataService: AppMarketDataService,
    private dialog: MatDialog,
  ) {
    this.MarketDataService.getInstrumentDataDetails().subscribe(instrumentDetails => this.updateInstrumentDataTable(instrumentDetails))
  }
  async ngAfterViewInit() {
    this.dataSource? null : this.MarketDataService.getInstrumentDataDetails().subscribe(data=>this.updateInstrumentDataTable(data));
  }
  openInstrumentDetailsForm (elem:instrumentCorpActions, action:string) {
 /*    this.dialogInstrumentModify = this.dialog.open (AppInvInstrumentModifyFormComponent,{minHeight:'600px', minWidth:'1300px', autoFocus: false, maxHeight: '90vh'})
    this.dialogInstrumentModify.componentInstance.action = action; */
    // this.dialogInstrumentModify.componentInstance.data = element;
  }
  updateInstrumentDataTable (corpActionData:instrumentDetails[]) {
    this.dataSource  = new MatTableDataSource(corpActionData);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.secid? this.dataSource.filter=this.secid : null;

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
}