import {Component, ViewChild, Input, ChangeDetectionStrategy, ElementRef} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {Subscription} from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {bcTransactionType_Ext } from 'src/app/models/accountng-intefaces.model';
import {formatNumber } from '@angular/common';
import {HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import {HandlingCommonTasksService } from 'src/app/services/handling-common-tasks.service';
import {AuthService } from 'src/app/services/auth.service';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {AccountingSchemesService } from 'src/app/services/accounting-schemes.service';
import {AppAccTransactionTypesFormComponent } from '../../forms/acc-transaction-types-form.component/acc-transaction-types-form.component';
import {tableHeaders } from 'src/app/models/interfaces.model';
@Component({
  selector: 'acc-transaction-types-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './acc-transaction-types-table.component.html',
  styleUrls: ['./acc-transaction-types-table.component.scss'],
})
export class AppaIAccTransactionTypesTable {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  private subscriptions = new Subscription()
  @Input() readOnly:boolean = false;
  @Input() idFeeMain:number;
  columnsWithHeaders: tableHeaders[] = [
    {
      "fieldName": "id",
      "displayName": "ID"
    },
    {
      "fieldName": "xActTypeCode_Ext",
      "displayName": "Code"
    },
    {
      "fieldName": "description",
      "displayName": "Description"
    },
    {
      "fieldName": "code2",
      "displayName": "Type"
    },
    {
      "fieldName": "manual_edit_forbidden",
      "displayName": "Manual Edit"
    },
    {
      "fieldName": "action",
      "displayName": "Action"
    }
  ]
  columnsToDisplay: string [];
  columnsHeaderToDisplay: string [];
  dataSource: MatTableDataSource<bcTransactionType_Ext>;
  public TransactionTypes: Map <string,string>
  public manualEdit = new Map <boolean|null,string> ([
    [true,'Forbidden'],
    [null,'Allowed'],
    [false,'Allowed']
  ])
  @ViewChild('filterALL', { static: false }) filterALL: ElementRef;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  multiFilter?: (data: bcTransactionType_Ext, filter: string) => boolean;
  refFeeForm : MatDialogRef<AppAccTransactionTypesFormComponent>
  constructor(
    private AuthServiceS:AuthService,  
    private HandlingCommonTasksS:HandlingCommonTasksService,
    private CommonDialogsService:HadlingCommonDialogsService,
    private AccountingSchemesService:AccountingSchemesService,
    private dialog: MatDialog,
  ) {
    this.TransactionTypes = this.AccountingSchemesService.TransactionTypes;
    this.columnsToDisplay=this.columnsWithHeaders.map(el=>el.fieldName);
    this.columnsHeaderToDisplay=this.columnsWithHeaders.map(el=>el.displayName);
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToBalanceData')[0].elementvalue;
    this.AccountingSchemesService.subjectTransactionTypePipe.next(null);
    this.subscriptions.add(this.AccountingSchemesService.receiveTransactionTypesReady().subscribe(data=>this.updateDataTable(data.data)))
  }
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  ngOnInit(): void {
    this.disabledControlElements = this.accessState === 'full'&&this.readOnly===false? false : true;
    this.multiFilter = (data: bcTransactionType_Ext, filter: string) => {
      let filter_array = filter.split(',').map(el=>[el,1]);
      this.columnsToDisplay.forEach(col=>filter_array.forEach(fil=>{
        data[col]&&fil[0].toString().toUpperCase()===(data[col]).toString().toUpperCase()? fil[1]=0:null
      })
        );
      return !filter || filter_array.reduce((acc,val)=>acc+Number(val[1]),0)===0;
    };
    this.subscriptions.add(this.AccountingSchemesService.receiveTransactionTypesReload().subscribe((data)=>this.submitQuery(false,false)));
  }
  updateDataTable (managementFeeData:bcTransactionType_Ext[]) {
    this.dataSource  = new MatTableDataSource(managementFeeData);
    this.dataSource.filterPredicate =this.multiFilter
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  submitQuery (reset:boolean=false, showSnackResult:boolean=true) {
    this.AccountingSchemesService.getTransactionTypes().subscribe(data => {
      this.updateDataTable(data);
      this.AccountingSchemesService.rewriteTransactionTypes(data);
      showSnackResult? this.CommonDialogsService.snackResultHandler({
        name:data['name'], 
        detail:data['name'] === 'error'? data['detail'] :  formatNumber (data.length,'en-US') + ' rows'}, 'Loaded ') : null;
    });
  }
  openTransactionTypeModifyForm(action: string,element: bcTransactionType_Ext) {
    let dataToForm = structuredClone(element);
    action==='Create_Example'? dataToForm.id=null:null;
    this.refFeeForm = this.dialog.open (AppAccTransactionTypesFormComponent,{minHeight:'30vh', width:'70vw', autoFocus: false, maxHeight: '90vh'})
    action==='Create'? this.refFeeForm.componentInstance.id.patchValue(this.idFeeMain):null;
    this.refFeeForm.componentInstance.action=action;
    this.refFeeForm.componentInstance.data=dataToForm;
    this.refFeeForm.componentInstance.modal_principal_parent.subscribe(success => {
      success? this.refFeeForm.close():null;
    })
  }
  updateFilter (el: string) {
    this.filterALL.nativeElement.value = this.filterALL.nativeElement.value + el+',';
    this.dataSource.filter = this.filterALL.nativeElement.value.slice(0,-1).trim().toLowerCase();
    (this.dataSource.paginator)? this.dataSource.paginator.firstPage() : null;
  }
  applyFilter(event: KeyboardEvent) {
    const filterValue = (event.target as HTMLInputElement).value 
    this.dataSource.filter = filterValue.trim().toLowerCase();
    this.dataSource.paginator? this.dataSource.paginator.firstPage():null;
  }
  clearFilter (input:HTMLInputElement) {
    input.value=''
    this.dataSource.filter = ''
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage()}
  }
  exportToExcel() {
    this.HandlingCommonTasksS.exportToExcel (this.dataSource.data,"TransactionTypesData", ['id'],[]);  
  }
}
