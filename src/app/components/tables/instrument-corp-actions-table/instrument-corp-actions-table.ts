import {AfterViewInit, Component, ViewEncapsulation, EventEmitter, Output, ViewChild, Input, SimpleChanges} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {animate, state, style, transition, trigger} from '@angular/animations';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { instrumentCorpActions, instrumentShort } from 'src/app/models/instruments.interfaces';
import { FormGroup} from '@angular/forms';
import { indexDBService } from 'src/app/services/indexDB.service';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { formatNumber } from '@angular/common';
import { HandlingCommonTasksService } from 'src/app/services/handling-common-tasks.service';
import { AuthService } from 'src/app/services/auth.service';
import { AppInstrumentCorpActionFormComponent } from '../../forms/instrument-corp-action-form.component/instrument-corp-action-form.component';
import { InstrumentDataService } from 'src/app/services/instrument-data.service';
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
  columnsToDisplay = ['date','secid', 'actiontype','actiontypename', 'unredemeedvalue','couponrate','couponamount', 'currency', 'action'];
  columnsHeaderToDisplay = ['date','SecID','Code', 'Action Title','unredemeed','rate','Amount', 'currency', 'issue','action' ];
  columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
  dataSource: MatTableDataSource<instrumentCorpActions>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @Output() public modal_principal_parent = new EventEmitter();
  panelOpenStateSecond = false;
  instruments: string[] = ['ClearAll'];
  searchParametersFG: FormGroup;
  @Input () coprData:instrumentCorpActions[] = [];
  @Input () instrument:instrumentShort;
  refCorpActionForm : MatDialogRef<AppInstrumentCorpActionFormComponent>
  constructor(
    private AuthServiceS:AuthService,  
    private HandlingCommonTasksS:HandlingCommonTasksService,
    private indexDBServiceS:indexDBService,
    private InstrumentDataS:InstrumentDataService,
    private CommonDialogsService:HadlingCommonDialogsService,
    private dialog: MatDialog,
  ) {
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToInstrumentData')[0].elementvalue;
    this.disabledControlElements = this.accessState === 'full'? false : true;
  }
  ngAfterViewInit() {
    this.indexDBServiceS.getIndexDBStaticTables('getInstrumentDataCorpActions').subscribe(data=> this.updateCAdataTable(data.data as instrumentCorpActions[]));
  }
  ngOnChanges(changes: SimpleChanges) {
    this.dataSource&&changes['instrument'].currentValue.secid? this.applyFilter(undefined, this.instrument.secid) : null;
  }
  openCorpActionForm (action:string, element:instrumentCorpActions) {    
    this.refCorpActionForm = this.dialog.open (AppInstrumentCorpActionFormComponent,{minHeight:'30vh', width:'70vw', autoFocus: false, maxHeight: '90vh'})
    this.refCorpActionForm.componentInstance.action = action; 
    this.refCorpActionForm.componentInstance.data = element;
    this.refCorpActionForm.componentInstance.instrument = this.instrument;
    this.refCorpActionForm.componentInstance.modal_principal_parent.subscribe(success => {
      success? this.refCorpActionForm.close():null;
      this.indexDBServiceS.reloadIndexDBStaticTable('getInstrumentDataCorpActions').subscribe(data => this.updateCAdataTable(data as instrumentCorpActions[]))
    })
  }
  updateCAdataTable (corpActionData:instrumentCorpActions[]) {
    this.dataSource  = new MatTableDataSource(corpActionData);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.instrument?.secid? this.applyFilter(undefined,this.instrument.secid) : null;
  }
  applyFilter(event?: KeyboardEvent, manualValue?:string) {
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
    this.InstrumentDataS.getInstrumentDataCorpActions().subscribe(corpActionData => {
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