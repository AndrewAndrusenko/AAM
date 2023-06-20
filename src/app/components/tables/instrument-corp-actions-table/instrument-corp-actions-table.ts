import {AfterViewInit, Component, ViewEncapsulation, EventEmitter, Output, ViewChild, Input, SimpleChanges} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {animate, state, style, transition, trigger} from '@angular/animations';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { Instruments, instrumentCorpActions } from 'src/app/models/intefaces';
import { FormGroup} from '@angular/forms';
import { AppMarketDataService } from 'src/app/services/app-market-data.service';
import { indexDBService } from 'src/app/services/indexDB.service';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { formatNumber } from '@angular/common';
import { HandlingCommonTasksService } from 'src/app/services/handling-common-tasks.service';
import { AuthService } from 'src/app/services/auth.service';
import { AppInstrumentCorpActionFormComponent } from '../../forms/instrument-corp-action-form/instrument-corp-action-form';
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
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  columnsToDisplay = ['date', 'isin','actiontype','unredemeedvalue','couponrate','couponamount', 'notinal', 'notinalcurrency', 'issuevolume', 'action'];
  columnsHeaderToDisplay = ['date','ISIN','type','unredemeed','rate','coupon', 'notinal', 'currency', 'issue','action' ];
  columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
  dataSource: MatTableDataSource<instrumentCorpActions>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @Output() public modal_principal_parent = new EventEmitter();
  panelOpenStateSecond = false;
  instruments: string[] = ['ClearAll'];
  searchParametersFG: FormGroup;
  @Input () coprData:instrumentCorpActions[] = [];
  @Input () instrument:any;
  refCorpActionForm : MatDialogRef<AppInstrumentCorpActionFormComponent>
  constructor(
    private MarketDataService: AppMarketDataService,
    private AuthServiceS:AuthService,  
    private HandlingCommonTasksS:HandlingCommonTasksService,
    private indexDBServiceS:indexDBService,
    private CommonDialogsService:HadlingCommonDialogsService,
    private dialog: MatDialog,
  ) {
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToInstrumentData')[0].elementvalue;
    this.disabledControlElements = this.accessState === 'full'? false : true;
  }
  async ngAfterViewInit() {
    this.indexDBServiceS.getIndexDBInstrumentStaticTables('getInstrumentDataCorpActions').then((data)=>{
      this.updateCAdataTable(data['data']);
    });
    console.log('instru',this.instrument);
  }
  ngOnChanges(changes: SimpleChanges) {
    console.log('instruCh',this.instrument,this.instrument.secid);

    this.dataSource? this.applyFilter(undefined, this.instrument.secid) : null;
  }
  openCorpActionForm (action:string, element:instrumentCorpActions) {    
    this.refCorpActionForm = this.dialog.open (AppInstrumentCorpActionFormComponent,{minHeight:'30vh', width:'70vw', autoFocus: false, maxHeight: '90vh'})
    this.refCorpActionForm.componentInstance.action = action; 
    this.refCorpActionForm.componentInstance.data = element;
    this.refCorpActionForm.componentInstance.instrument = this.instrument;
    this.refCorpActionForm.componentInstance.modal_principal_parent.subscribe(success => {
      success? this.refCorpActionForm.close():null;
      this.indexDBServiceS.reloadIndexDBStaticTable('getInstrumentDataDetails').then(data => this.updateCAdataTable(data['data']))
    })
  }
  updateCAdataTable (corpActionData:instrumentCorpActions[]) {
    this.dataSource  = new MatTableDataSource(corpActionData);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.instrument? this.applyFilter(undefined,this.instrument.secid) : null;
  }
  applyFilter(event?: any, manualValue?:string) {
    const filterValue =  manualValue || (event.target as HTMLInputElement).value;
    this.dataSource? this.dataSource.filter = filterValue.trim().toLowerCase():null
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage();}
  }
  clearFilter (input : HTMLInputElement) {
    input.value='';
    this.dataSource.filter = '';
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage()}
  }
  submitQuery () {
    this.dataSource.data=null;
    this.MarketDataService.getInstrumentDataCorpActions().subscribe(corpActionData => {
      this.updateCAdataTable(corpActionData);
      this.CommonDialogsService.snackResultHandler({name:'success',detail: formatNumber (corpActionData.length,'en-US') + ' rows'}, 'Loaded ');
    })
  }
  exportToExcel() {
    this.HandlingCommonTasksS.exportToExcel (this.dataSource.data,"corpActionsData")
  }
  get  marketSource () {return this.searchParametersFG.get('marketSource') } 
  get  boards () {return this.searchParametersFG.get('boards') } 
  get  secidList () {return this.searchParametersFG.get('secidList') } 
}