import {AfterViewInit, Component, ViewEncapsulation, EventEmitter, Output, ViewChild, Input, SimpleChanges} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {animate, state, style, transition, trigger} from '@angular/animations';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { instrumentDetails } from 'src/app/models/intefaces';
import { AppMarketDataService } from 'src/app/services/app-market-data.service';
import { AppInvInstrumentDetailsFormComponent } from '../../forms/instrument-details-form/instrument-details-form';
import { indexDBService } from 'src/app/services/indexDB.service';
import { AuthService } from 'src/app/services/auth.service';
@Component({
  selector: 'app-table-instrument-details',
  templateUrl: './instrument-details-table.component.html',
  styleUrls: ['./instrument-details-table.component.scss'],
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
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  columnsToDisplay = ['status','boardid', 'boardname', 'listlevel','issuesize', 'lotsize', 'minstep', 'action' ];
  columnsHeaderToDisplay = ['status','board', 'board name', 'list','issue', 'lot', 'step', 'action' ];
  dataSource: MatTableDataSource<instrumentDetails>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @Output() public modal_principal_parent = new EventEmitter();
  @Input () instrumentDetails:instrumentDetails[] = [];
  @Input () secid:string;
  dialogInstrumentDetails: MatDialogRef<AppInvInstrumentDetailsFormComponent>;
  constructor(
    private AuthServiceS:AuthService,  
    private indexDBServiceS:indexDBService,
    private dialog: MatDialog,
  ) {
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToInstrumentData')[0].elementvalue;
    this.disabledControlElements = this.accessState === 'full'? false : true;
  }
  async ngAfterViewInit() {
    this.indexDBServiceS.getIndexDBStaticTables('getInstrumentDataDetails').then ((data)=>this.updateInstrumentDataTable (data['data']))
  }
  ngOnChanges(changes: SimpleChanges) {this.dataSource? this.applyFilter(undefined, this.secid) : null}
  applyFilter(event?: any, manualValue?:string) {
    const filterValue =  manualValue || (event.target as HTMLInputElement).value;
    this.dataSource? this.dataSource.filter = filterValue.trim().toLowerCase():null
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage();}
  }
  openInstrumentDetailsForm (action:string, element:instrumentDetails) {
    this.dialogInstrumentDetails = this.dialog.open (AppInvInstrumentDetailsFormComponent,{minHeight:'30vh', minWidth:'1300px', autoFocus: false, maxHeight: '90vh'})
    this.dialogInstrumentDetails.componentInstance.action = action; 
    this.dialogInstrumentDetails.componentInstance.data = element;
    this.dialogInstrumentDetails.componentInstance.secidParam = this.secid;
    this.dialogInstrumentDetails.componentInstance.modal_principal_parent.subscribe(success => {
      success? this.dialogInstrumentDetails.close():null;
      this.indexDBServiceS.reloadIndexDBStaticTable('getInstrumentDataDetails').then(data => this.updateInstrumentDataTable(data['data']))
    })
  }
  updateInstrumentDataTable (corpActionData:instrumentDetails[]) {
    this.dataSource  = new MatTableDataSource(corpActionData);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.secid? this.applyFilter(undefined,this.secid) : null;
  }
}