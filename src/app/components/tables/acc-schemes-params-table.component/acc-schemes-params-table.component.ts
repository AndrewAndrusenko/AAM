import {Component, ViewChild, Input, ChangeDetectionStrategy} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {Subscription, } from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {formatNumber } from '@angular/common';
import {HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import {HandlingCommonTasksService } from 'src/app/services/handling-common-tasks.service';
import {AuthService } from 'src/app/services/auth.service';
import {AccountingSchemesService } from 'src/app/services/accounting-schemes.service';
import {tableHeaders } from 'src/app/models/interfaces.model';
import { bcSchemesParameters,bcSchemesProcesses } from 'src/app/models/acc-schemes-interfaces';
import {Clipboard} from '@angular/cdk/clipboard';
@Component({
  selector: 'acc-schemes-params-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './acc-schemes-params-table.component.html',
  styleUrls: ['./acc-schemes-params-table.component.scss'],
})
export class AppAccSchemesParamsTable {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  processDesc: string = '';
  private subscriptions = new Subscription()
  @Input() readOnly:boolean = false;
  @Input() idFeeMain:number;
  @Input() schemesProcess: bcSchemesProcesses[];
  columnsWithHeaders: tableHeaders[] = [
    {
      "fieldName": "param_code",
      "displayName": "Code"
    },
    {
      "fieldName": "param_descrption",
      "displayName": "Descrption"
    }

  ]
  columnsToDisplay: string [];
  columnsHeaderToDisplay: string [];
  dataSource: MatTableDataSource<bcSchemesParameters>;
  fullDataSet: bcSchemesParameters[];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  constructor(
    private clipboard:Clipboard,
    private AuthServiceS:AuthService,  
    private HandlingCommonTasksS:HandlingCommonTasksService,
    private CommonDialogsService:HadlingCommonDialogsService,
    private AccountingSchemesService:AccountingSchemesService,
  ) {
    this.columnsToDisplay=this.columnsWithHeaders.map(el=>el.fieldName);
    this.columnsHeaderToDisplay=this.columnsWithHeaders.map(el=>el.displayName);
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToBalanceData')[0].elementvalue;
    this.submitQuery(false,false)
  }
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  ngOnInit(): void {
    this.disabledControlElements = this.accessState === 'full'&&this.readOnly===false? false : true;
  }
  updateDataTable (ParameterData:bcSchemesParameters[]) {
    this.fullDataSet = ParameterData;
    this.dataSource  = new MatTableDataSource(ParameterData);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  submitQuery (reset:boolean=false, showSnackResult:boolean=true) {
    this.AccountingSchemesService.getSchemesParameters().subscribe(data => {
      this.updateDataTable(data)
      showSnackResult? this.CommonDialogsService.snackResultHandler({
        name:data['name'], 
        detail:data['name'] === 'error'? data['detail'] :  formatNumber (data.length,'en-US') + ' rows'}, 'Loaded ') : null;
    });
  }
  changeParamsList(processID:number) {
    this.processDesc = this.schemesProcess.find(el=>el.id===processID).process_description;
    this.dataSource.data = this.fullDataSet.filter(el=>el.process_code_id===processID);
  }
  copyEl(el:string) {
    this.clipboard.copy(el)
    this.CommonDialogsService.snackResultHandler({name:'success',detail: el +' has been copied'},'Clipboard',null,null,500)
  }
  exportToExcel() {
     this.HandlingCommonTasksS.exportToExcel (this.dataSource.data,"SchemesParameterData",['id'],[]);  
  }
}
