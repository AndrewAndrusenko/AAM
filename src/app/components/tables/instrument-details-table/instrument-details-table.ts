import {AfterViewInit, Component, ViewEncapsulation, EventEmitter, Output, ViewChild, Input, SimpleChanges} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {animate, state, style, transition, trigger} from '@angular/animations';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { instrumentCorpActions, instrumentDetails, marketDataSources } from 'src/app/models/intefaces';
import { FormControl, FormGroup} from '@angular/forms';
import { AppMarketDataService } from 'src/app/services/app-market-data.service';
import { AppInvInstrumentDetailsFormComponent } from '../../forms/instrument-details-form/instrument-details-form';
import { indexDBService } from 'src/app/services/indexDB.service';
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
  columnsToDisplay = ['status','boardid', 'boardname', 'listlevel','issuesize','facevalue','matdate','regnumber', 'currencyid', 'lotsize', 'minstep', 'action' ];
  columnsHeaderToDisplay = ['status','board', 'board name', 'listlevel','issue','facevalue','maturity','regnumber', 'cur', 'lot', 'step', 'action' ];
  dataSource: MatTableDataSource<instrumentDetails>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @Output() public modal_principal_parent = new EventEmitter();
  @Input () instrumentDetails:instrumentDetails[] = [];
  @Input () secid:string;
  panelOpenStateSecond = false;
  dialogInstrumentDetails: MatDialogRef<AppInvInstrumentDetailsFormComponent>;

  constructor(
    private MarketDataService: AppMarketDataService,
    private indexDBServiceS:indexDBService,
    private dialog: MatDialog,
  ) {}
  async ngAfterViewInit() {
    this.indexDBServiceS.getIndexDBInstrumentStaticTables('getInstrumentDataDetails').then ((data)=>this.updateInstrumentDataTable (data['data']))
  }
  ngOnChanges(changes: SimpleChanges) {
    this.applyFilter(undefined, this.secid);
  }
  openInstrumentDetailsForm (action:string, element:instrumentDetails) {
    this.dialogInstrumentDetails = this.dialog.open (AppInvInstrumentDetailsFormComponent,{minHeight:'30vh', minWidth:'1300px', autoFocus: false, maxHeight: '90vh'})
    this.dialogInstrumentDetails.componentInstance.action = action; 
    this.dialogInstrumentDetails.componentInstance.data = element;
  }
  updateInstrumentDataTable (corpActionData:instrumentDetails[]) {
    this.dataSource  = new MatTableDataSource(corpActionData);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.secid? this.dataSource.filter=this.secid : null;

  }
  applyFilter(event: any, manualValue?:string) {
    const filterValue =  manualValue || (event.target as HTMLInputElement).value;
    this.dataSource? this.dataSource.filter = filterValue.trim().toLowerCase():null
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage();}
  }
  clearFilter (fFormControl : FormControl) {
    fFormControl.patchValue('')
    this.dataSource.filter = ''
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage()}
  }
}