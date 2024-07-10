import {AfterViewInit, Component, ViewEncapsulation, EventEmitter, Output, ViewChild, Input} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {animate, state, style, transition, trigger} from '@angular/animations';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { instrumentDetails } from 'FrontendAngularSrc/app/models/instruments.interfaces';
import { AppInvInstrumentDetailsFormComponent } from '../../forms/instrument-details-form.component/instrument-details-form.component';
import { indexDBService } from 'FrontendAngularSrc/app/services/indexDB.service';
import { AuthService } from 'FrontendAngularSrc/app/services/auth.service';
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
  ngAfterViewInit() {
    this.indexDBServiceS.getIndexDBStaticTables('getInstrumentDataDetails').subscribe ((data)=>this.updateInstrumentDataTable (data.data as instrumentDetails[]))
  }
  ngOnChanges() {this.dataSource? this.applyFilter(this.secid) : null}
  applyFilter(manualValue?:string) {
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
      this.indexDBServiceS.reloadIndexDBStaticTable('getInstrumentDataDetails').subscribe(data => this.updateInstrumentDataTable(data as instrumentDetails[]))
    })
  }
  updateInstrumentDataTable (corpActionData:instrumentDetails[]) {
    this.dataSource  = new MatTableDataSource(corpActionData);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.secid? this.applyFilter(this.secid) : null;
  }
}