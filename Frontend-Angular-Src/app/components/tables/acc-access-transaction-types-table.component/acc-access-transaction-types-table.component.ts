import {Component, ViewChild, Input, ChangeDetectionStrategy, ElementRef} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {accessTransactionTypes } from 'Frontend-Angular-Src/app/models/accountng-intefaces.model';
import {formatNumber } from '@angular/common';
import {HadlingCommonDialogsService } from 'Frontend-Angular-Src/app/services/hadling-common-dialogs.service';
import {HandlingCommonTasksService } from 'Frontend-Angular-Src/app/services/handling-common-tasks.service';
import {AuthService } from 'Frontend-Angular-Src/app/services/auth.service';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {AccountingSchemesService } from 'Frontend-Angular-Src/app/services/accounting-schemes.service';
import {tableHeaders } from 'Frontend-Angular-Src/app/models/interfaces.model';
import { AppAccAccessTTFormComponent } from '../../forms/acc-access-transaction-types-form.component/acc-access-transaction-types-form.component';
import { Subscription } from 'rxjs';
@Component({
  selector: 'acc-access-transaction-types-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './acc-access-transaction-types-table.component.html',
  styleUrls: ['./acc-access-transaction-types-table.component.scss'],
})
export class AppaAccAccessTransactionTypesTable {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  accessRoles:string[]=[];
  private subscriptions = new Subscription();
  @Input() readOnly:boolean = false;
  @Input() idFeeMain:number;
  columnsWithHeaders: tableHeaders[] = [
    {
      "fieldName": "id",
      "displayName": "ID"
    },
    {
      "fieldName": "role",
      "displayName": "Role"
    },
    {
      "fieldName": "transaction_type_id",
      "displayName": "TT ID"
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
      "fieldName": "action",
      "displayName": "Action"
    }
  ]
  columnsToDisplay: string [];
  columnsHeaderToDisplay: string [];
  dataSource: MatTableDataSource<accessTransactionTypes>;
  public TransactionTypes: Map <string,string>

  @ViewChild('filterALL', { static: false }) filterALL: ElementRef;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  multiFilter?: (data: accessTransactionTypes, filter: string) => boolean;
  refFeeForm : MatDialogRef<AppAccAccessTTFormComponent>
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
    this.accessRoles = this.AuthServiceS.dbAccessRoles;
    this.subscriptions.add(this.AccountingSchemesService.receiveTAceessransactionTypesReload().subscribe(()=>this.submitQuery(false,false)))
  }
  ngOnInit(): void {
    this.submitQuery(false,false);
    this.disabledControlElements = this.accessState === 'full'&&this.readOnly===false? false : true;
    this.multiFilter = (data: accessTransactionTypes, filter: string) => {
      let filter_array = filter.split(',').map(el=>[el,1]);
      this.columnsToDisplay.forEach(col=>filter_array.forEach(fil=>{
        data[col]&&fil[0].toString().toUpperCase()===(data[col]).toString().toUpperCase()? fil[1]=0:null
      })
        );
      return !filter || filter_array.reduce((acc,val)=>acc+Number(val[1]),0)===0;
    };
  }
  updateDataTable (managementFeeData:accessTransactionTypes[]) {
    this.dataSource  = new MatTableDataSource(managementFeeData);
    this.dataSource.filterPredicate =this.multiFilter
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  submitQuery (reset:boolean=false, showSnackResult:boolean=true) {
    this.AccountingSchemesService.getAccessTransactionTypes().subscribe(data => {
      this.updateDataTable(data);
      showSnackResult? this.CommonDialogsService.snackResultHandler({
        name:data['name'], 
        detail:data['name'] === 'error'? data['detail'] :  formatNumber (data.length,'en-US') + ' rows'}, 'Loaded ') : null;
    });
  }
  openAccessTTModifyForm(action: string,element: accessTransactionTypes) {
    let dataToForm = structuredClone(element);
    action==='Create_Example'? dataToForm.id=null:null;
    this.refFeeForm = this.dialog.open (AppAccAccessTTFormComponent,{minHeight:'30vh', width:'70vw', autoFocus: false, maxHeight: '90vh'})
    action==='Create'? this.refFeeForm.componentInstance.id.patchValue(this.idFeeMain):null;
    this.refFeeForm.componentInstance.action=action;
    this.refFeeForm.componentInstance.data=dataToForm;
    this.refFeeForm.componentInstance.accessRoles=this.accessRoles;
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
    this.HandlingCommonTasksS.exportToExcel (this.dataSource.data,"TransactionAccessTT", ['id'],[]);  
  }
}
