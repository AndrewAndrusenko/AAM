import {Component, ViewChild, Input, ChangeDetectionStrategy, ElementRef, ChangeDetectorRef} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {EMPTY, Subscription } from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {formatNumber } from '@angular/common';
import {HadlingCommonDialogsService } from 'FrontendAngularSrc/app/services/hadling-common-dialogs.service';
import {HandlingCommonTasksService } from 'FrontendAngularSrc/app/services/handling-common-tasks.service';
import {AuthService } from 'FrontendAngularSrc/app/services/auth.service';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {AccountingSchemesService } from 'FrontendAngularSrc/app/services/accounting-schemes.service';
import {tableHeaders } from 'FrontendAngularSrc/app/models/interfaces.model';
import {bcSchemeAccountTransaction, bcSchemesProcesses } from 'FrontendAngularSrc/app/models/acc-schemes-interfaces';
import {AppAccSchemesAL_FormComponent } from '../../forms/acc-schemes-al-form.component/acc-schemes-al-form.component';
@Component({
  selector: 'acc-schemes-AL-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './acc-schemes-AL-table.component.html',
  styleUrls: ['./acc-schemes-AL-table.component.scss'],
})
export class AppAccSchemesAL_Table {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  private subscriptions = new Subscription()
  @Input() readOnly:boolean = false;
  @Input() idFeeMain:number;
  columnsWithHeaders: tableHeaders[] = [
    {
      "fieldName": "action",
      "displayName": "Action"
    },
    {
      "fieldName": "id",
      "displayName": "ID"
    },
    {
      "fieldName": "cSchemeGroupId",
      "displayName": "SchemeCode"
    },
    {
      "fieldName": "XactTypeCode_Ext",
      "displayName": "Code"
    },
    {
      "fieldName": "XactTypeCode",
      "displayName": "Type"
    },
    {
      "fieldName": "ledger_no",
      "displayName": "Ledger"
    },
    {
      "fieldName": "account_no",
      "displayName": "Account"
    },
    {
      "fieldName": "dataTime",
      "displayName": "Date"
    },
    {
      "fieldName": "amountTransaction",
      "displayName": "Amount"
    },
    {
      "fieldName": "entryDetails",
      "displayName": "Details"
    },
    {
      "fieldName": "idtrade",
      "displayName": "Trade ID"
    },
    {
      "fieldName": "accountNo",
      "displayName": "AccountNo"
    },
    {
      "fieldName": "cLedgerType",
      "displayName": "cLedgerType"
    },
    {
      "fieldName": "extTransactionId",
      "displayName": "extTransactionId"
    }
  ]
  columnsToDisplay: string [];
  columnsHeaderToDisplay: string [];
  dataSource: MatTableDataSource<bcSchemeAccountTransaction>;
  public schemesProcess: bcSchemesProcesses[];
  public TransactionTypes: Map <string,string>
  public TransactionCodes: Map <string,{desc:string,code2:number}>
  @ViewChild('filterALL', { static: false }) filterALL: ElementRef;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  multiFilter?: (data: bcSchemeAccountTransaction, filter: string) => boolean;
  refFeeForm : MatDialogRef<AppAccSchemesAL_FormComponent>
  constructor(
    private AuthServiceS:AuthService,  
    private HandlingCommonTasksS:HandlingCommonTasksService,
    private CommonDialogsService:HadlingCommonDialogsService,
    private AccountingSchemesService:AccountingSchemesService,
    private dialog: MatDialog,
    private ref: ChangeDetectorRef
  ) {
    this.TransactionTypes = this.AccountingSchemesService.TransactionTypes;
    this.columnsToDisplay=this.columnsWithHeaders.map(el=>el.fieldName);
    this.columnsHeaderToDisplay=this.columnsWithHeaders.map(el=>el.displayName);
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToBalanceData')[0].elementvalue;
    this.submitQuery(false,false)
    this.AccountingSchemesService.subjectTransactionTypePipe.next(null);
    this.subscriptions.add(this.AccountingSchemesService.receiveTransactionTypesReady().subscribe(typeTransaction=>{
      this.TransactionCodes= new Map (
        typeTransaction.data
        .sort((a,b)=>{ return a.xActTypeCode_Ext>b.xActTypeCode_Ext? 1 : a.xActTypeCode_Ext<b.xActTypeCode_Ext? -1:0})
        .filter(el=>[1,2].includes(Number(el.code2)))
        .map(el=>{return [el.id.toString(),{desc:el.xActTypeCode_Ext+' - '+el.description+' '+el.code2,code2:Number(el.code2)}]})
      )
      this.ref.markForCheck();
    }))
    this.subscriptions.add(this.AccountingSchemesService.receiveSchemeAccountTransactionReload().subscribe(()=>this.submitQuery(false,false)))

  }
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  ngOnInit(): void {
    this.disabledControlElements = this.accessState === 'full'&&this.readOnly===false? false : true;
    this.multiFilter = (data: bcSchemeAccountTransaction, filter: string) => {
      let filter_array = filter.split(',').map(el=>[el,1]);
      this.columnsToDisplay.forEach(col=>filter_array.forEach(fil=>{
        data[col]&&fil[0].toString().toUpperCase()===(data[col]).toString().toUpperCase()? fil[1]=0:null
      })
        );
      return !filter || filter_array.reduce((acc,val)=>acc+Number(val[1]),0)===0;
    };
  }
  ngAfterViewInit(): void {
    this.AccountingSchemesService.getSchemesProcesses().subscribe(data=>this.schemesProcess=data)
  }
  updateDataTable (managementFeeData:bcSchemeAccountTransaction[]) {
    this.dataSource  = new MatTableDataSource(managementFeeData);
    this.dataSource.filterPredicate =this.multiFilter
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  submitQuery (reset:boolean=false, showSnackResult:boolean=true) {
    this.AccountingSchemesService.getSchemeAccountTransaction().subscribe(data => {
      this.updateDataTable(data)
      showSnackResult? this.CommonDialogsService.snackResultHandler({
        name:data['name'], 
        detail:data['name'] === 'error'? data['detail'] :  formatNumber (data.length,'en-US') + ' rows'}, 'Loaded ') : null;
    });
  }
  openALSchemeModifyForm(action: string,element: bcSchemeAccountTransaction) {
    let dataToForm = structuredClone(element);
    action==='Create_Example'? dataToForm.id=null:null;
    this.refFeeForm = this.dialog.open (AppAccSchemesAL_FormComponent,{minHeight:'30vh', width:'70vw', autoFocus: false, maxHeight: '90vh'})
    action==='Create'? this.refFeeForm.componentInstance.id.patchValue(this.idFeeMain):null;
    this.refFeeForm.componentInstance.action=action;
    this.refFeeForm.componentInstance.data=dataToForm;
    this.refFeeForm.componentInstance.schemesProcess=this.schemesProcess;
    this.refFeeForm.componentInstance.TransactionCodes=Array.from(this.TransactionCodes,([key,value])=>{return{id:key,name:value.desc,code2:value.code2.toString()}});
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
    this.HandlingCommonTasksS.exportToExcel (this.dataSource.data,"TransactionTypesData",['id'],[]);  
  }
}
