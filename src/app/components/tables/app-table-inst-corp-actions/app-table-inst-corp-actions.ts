import {AfterViewInit, Component, ViewEncapsulation, EventEmitter, Output, ViewChild, Input} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {Observable, Subscription } from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {animate, state, style, transition, trigger} from '@angular/animations';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { Instruments, instrumentCorpActions, instrumentDetails, marketDataSources } from 'src/app/models/accounts-table-model';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {MatChipInputEvent} from '@angular/material/chips';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import * as XLSX from 'xlsx'
import { AppMarketDataService } from 'src/app/services/app-market-data.service';
import { menuColorGl,investmentNodeColor, investmentNodeColorChild, additionalLightGreen } from 'src/app/models/constants';
import { AppInvInstrumentModifyFormComponent } from '../../forms/app-inv-instrument-modify-form/app-inv-instrument-modify-form';
@Component({
  selector: 'app-table-inst-corp-actions',
  templateUrl: './app-table-inst-corp-actions.html',
  styleUrls: ['./app-table-inst-corp-actions.scss'],
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
  @Input() FormMode:string = 'Full'
  marketSources:marketDataSources[] =  [];
    columnsToDisplay = ['date', 'isin','actiontype','unredemeedvalue','couponrate','couponamount', 'notinal', 'notinalcurrency', 'issuevolume', 'action'];
  columnsHeaderToDisplay = ['date','isin','type','unredemeed','rate','coupon amount', 'notinal', 'notinal currency', 'issue volume','action' ];
  columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];

  dataSource: MatTableDataSource<instrumentCorpActions>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @Output() public modal_principal_parent = new EventEmitter();
  private subscriptionName: Subscription;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  
  addOnBlur = true;
  panelOpenStateSecond = false;
  instrumentDetailsArr:instrumentDetails[] = [];
  instrumentCorpActions:instrumentCorpActions[] = [];
  accessToClientData: string = 'true';
  instruments: string[] = ['ClearAll'];
  public filterednstrumentsLists : Observable<string[]>;
  
  boardIDs =[]
  searchParametersFG: FormGroup;
  filterlFormControl = new FormControl('');
  filterlAllFormControl = new FormControl('');
  @Input () coprData:instrumentCorpActions[] = [];
  dialogInstrumentModify: MatDialogRef<AppInvInstrumentModifyFormComponent>;

  defaultFilterPredicate?: (data: any, filter: string) => boolean;
  secidfilter?: (data: any, filter: string) => boolean;
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
    this.dialogInstrumentModify = this.dialog.open (AppInvInstrumentModifyFormComponent,{minHeight:'600px', minWidth:'1300px', autoFocus: false, maxHeight: '90vh'})
    this.dialogInstrumentModify.componentInstance.action = action;
    // this.dialogInstrumentModify.componentInstance.data = element;
  }
  updateInstrumentDataTable (corpActionData:instrumentCorpActions[]) {
    this.dataSource  = new MatTableDataSource(corpActionData);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    console.log('cor',corpActionData);
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