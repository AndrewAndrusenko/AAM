import {Component, ViewChild, Input, ChangeDetectionStrategy, ElementRef} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {Subscription} from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {StrategiesGlobalData, tableHeaders } from 'src/app/models/interfaces.model';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {HandlingCommonTasksService } from 'src/app/services/handling-common-tasks.service';
import {AuthService } from 'src/app/services/auth.service';
import {AtuoCompleteService } from 'src/app/services/auto-complete.service';
import {restrictionVerificationAllocation } from 'src/app/models/restrictions-interfaces.model';
import { MatDialogRef } from '@angular/material/dialog';
@Component({
  selector: 'app-inv-restriction-verify-alloc-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inv-restriction-verify-alloc-table.component.html',
  styleUrls: ['./inv-restriction-verify-alloc-table.component.scss'],
})
export class AppInvRestrictionVerifyAllocTableComponent {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  @Input() rowsPerPages:number = 15;
  @Input() dataVerification:restrictionVerificationAllocation[] = [];

  columnsWithHeaders: tableHeaders[] =[

    {
      "fieldName": "id",
      "displayName": "ID"
    },
    {
      "fieldName": "code",
      "displayName": "Code"
    },
    {
      "fieldName": "rest_type",
      "displayName": "RS_Type"
    },
    {
      "fieldName": "param",
      "displayName": "RS_Param"
    },
    {
      "fieldName": "order_qty",
      "displayName": "Order Qty"
    },
    {
      "fieldName": "new_viol",
      "displayName": "New Viol"
    },    
    {
      "fieldName": "parent_order",
      "displayName": "Bulk"
    },    
    {
      "fieldName": "new_wgt",
      "displayName": "New Wgt"
    },    
    {
      "fieldName": "new_mtm",
      "displayName": "New MTM"
    },
    {
      "fieldName": "restrictinon",
      "displayName": "RS_Value"
    },
    {
      "fieldName": "act_violation_and_orders",
      "displayName": "Violation(orders)"
    },
    {
      "fieldName": "act_violation",
      "displayName": "Violation"
    },
    {
      "fieldName": "mp_violation",
      "displayName": "Violation(MP)"
    },
    {
      "fieldName": "act_weight_and_orders",
      "displayName": "Weight(orders)"
    },
    {
      "fieldName": "act_weight",
      "displayName": "Weight"
    },
    {
      "fieldName": "mp_weight",
      "displayName": "Weight(MP)"
    },
    {
      "fieldName": "act_mtm",
      "displayName": "MTM"
    },
    {
      "fieldName": "npv",
      "displayName": "NPV"
    },
    {
      "fieldName": "net_orders",
      "displayName": "Orders"
    },
    {
      "fieldName": "mp_name",
      "displayName": "MP"
    }
  ]
  columnsToDisplay: string [];
  columnsHeaderToDisplay: string [];
  dataSource: MatTableDataSource<restrictionVerificationAllocation>;
  fullDataSource: restrictionVerificationAllocation[];
  @ViewChild('filterALL', { static: false }) filterALL: ElementRef;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  defaultFilterPredicate?: (data: restrictionVerificationAllocation, filter: string) => boolean;
  multiFilter?: (data: restrictionVerificationAllocation, filter: string) => boolean;
  mp_strategies_list: StrategiesGlobalData[]=[];
  constructor(
    public dialogRefConfirm: MatDialogRef<AppInvRestrictionVerifyAllocTableComponent>,
    private AuthService:AuthService,  
    private HandlingCommonTasksS:HandlingCommonTasksService,
    private AutoCompService:AtuoCompleteService,
  ) {
    this.accessState = this.AuthService.accessRestrictions.filter(el =>el.elementid==='accessToTradesData')[0].elementvalue;
    this.disabledControlElements = this.accessState === 'full'? false : true;
    this.columnsToDisplay=this.columnsWithHeaders.map(el=>el.fieldName);
    this.columnsHeaderToDisplay=this.columnsWithHeaders.map(el=>el.displayName);
    this.AutoCompService.subModelPortfoliosList.next(true);
  }
  ngOnInit(): void {
    this.updateRestrictionVerifyTable(this.dataVerification)
  }
  cancelAlloc (){
    this.dialogRefConfirm.close(false)
  }
  acceptAlloc (){
    this.dialogRefConfirm.close(true)
  }
  updateRestrictionVerifyTable (positionsData:restrictionVerificationAllocation[]) {
    this.dataSource  = new MatTableDataSource(positionsData);
    this.dataSource.filterPredicate =this.multiFilter
    this.filterALL? this.filterALL.nativeElement.value=null : null;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
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
    let numberFields=[
      "id",
      "restrictinon",
      "act_violation_and_orders",
      "act_violation",
      "mp_violation",
      "act_weight_and_orders",
      "act_weight",
      "mp_weight",
      "act_mtm",
      "npv",
      "net_orders",
      "new_wgt", 
      "new_viol", 
      "new_mtm",
      "order_qty", 
      "parent_order" 
    ];

    let dateFields=[];
    this.HandlingCommonTasksS.exportToExcel (this.dataSource.data,"restrictionVerificationAlloc",numberFields,dateFields);  
  }
}