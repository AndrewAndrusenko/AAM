import {Component, ViewChild, Input, ChangeDetectionStrategy, ElementRef} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {Subscription} from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {tableHeaders } from 'src/app/models/interfaces.model';
import {formatNumber } from '@angular/common';
import {HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import {HandlingCommonTasksService } from 'src/app/services/handling-common-tasks.service';
import {AuthService } from 'src/app/services/auth.service';
import {AppAccFeesScheduleFormComponent } from '../../forms/acc-fees-schedule-form.component/acc-fees-schedule-form.component';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {restrictionsData } from 'src/app/models/restrictions-interfaces.model';
import {AppRestrictionsHandlingService } from 'src/app/services/restrictions-handling.service';
import { AppInvRestrictionMainFormComponent } from '../../forms/inv-restriction-main-form/inv-restriction-main-form';
@Component({
  selector: 'inv-restriction-schemes-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inv-restriction-schemes-table.component.html',
  styleUrls: ['./inv-restriction-schemes-table.component.scss'],
})
export class AppaInvRestrictionSchemesTable {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  private subscriptions = new Subscription()
  @Input() readOnly:boolean = false;
  @Input() idportfolios:number[];
  @Input() portCodes:string[];
  @Input() onChanges:boolean;
  columnsWithHeaders: tableHeaders[] = [
      {
        "fieldName": "id",
        "displayName": "ID"
      },
      {
        "fieldName": "portfolioname",
        "displayName": "Code"
      },
      {
        "fieldName": "idportfolio",
        "displayName": "ID Port"
      },
      {
        "fieldName": "object_description",
        "displayName": "Description"
      },
      {
        "fieldName": "value",
        "displayName": "Restriction"
      },
      {
        "fieldName": "param",
        "displayName": "Parameter"
      },
    
      {
        "fieldName": "object_id",
        "displayName": "SecType ID"
      },
      {
        "fieldName": "restriction_type_id",
        "displayName": "Type ID"
      },
      {
        "fieldName": "object_code",
        "displayName": "Restriction Type"
      },
      {
        "fieldName": "action",
        "displayName": "Action"
      } 
    ]
  columnsToDisplay: string [];
  columnsHeaderToDisplay: string [];
  dataSource: MatTableDataSource<restrictionsData>;
  fullDataSource: restrictionsData[];
  @ViewChild('filterALL', { static: false }) filterALL: ElementRef;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  multiFilter?: (data: restrictionsData, filter: string) => boolean;
  refFeeForm : MatDialogRef<AppInvRestrictionMainFormComponent>

  constructor(
    private AuthServiceS:AuthService,  
    private HandlingCommonTasksS:HandlingCommonTasksService,
    private CommonDialogsService:HadlingCommonDialogsService,
    private RestrictionsHandlingService:AppRestrictionsHandlingService,
    private dialog: MatDialog,
  ) {
    this.columnsToDisplay=this.columnsWithHeaders.map(el=>el.fieldName);
    this.columnsHeaderToDisplay=this.columnsWithHeaders.map(el=>el.displayName);
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToPortfolioData')[0].elementvalue;
  }
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  ngOnInit(): void {
    this.disabledControlElements = this.accessState === 'full'&&this.readOnly===false? false : true;
    this.multiFilter = (data: restrictionsData, filter: string) => {
      let filter_array = filter.split(',').map(el=>[el,1]);
      this.columnsToDisplay.forEach(col=>filter_array.forEach(fil=>{
        data[col]&&fil[0].toString().toUpperCase()===(data[col]).toString().toUpperCase()? fil[1]=0:null
      }));
      return !filter || filter_array.reduce((acc,val)=>acc+Number(val[1]),0)===0;
    };
    this.onChanges===false? this.submitQuery(false,false):null;
    this.subscriptions.add(this.RestrictionsHandlingService.recieveRestrictionsDataMainReload().subscribe(()=>this.submitQuery(false,false)));
  }
  ngOnChanges(): void {
    this.onChanges&&this.idportfolios.length? this.submitQuery(false,false):null;
  }
  updateDataTable (restrictionsData:restrictionsData[]) {
    this.fullDataSource=restrictionsData;
    this.dataSource  = new MatTableDataSource(restrictionsData);
    this.dataSource.filterPredicate =this.multiFilter
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  submitQuery (reset:boolean=false, showSnackResult:boolean=true) {
    this.RestrictionsHandlingService.getRestrictionsDataMain(this.idportfolios? this.idportfolios:null).subscribe(data => {
      this.updateDataTable(data)
      showSnackResult? this.CommonDialogsService.snackResultHandler({
        name:data['name'], 
        detail:data['name'] === 'error'? data['detail'] :  formatNumber (data.length,'en-US') + ' rows'}, 'Loaded ') : null;
    });
  }
  openFeeModifyForm(action: string,element: restrictionsData) {
    let dataToForm = structuredClone(element);
    dataToForm? dataToForm.restriction_type_id=Number(dataToForm.restriction_type_id):null;
    action==='Create_Example'? dataToForm.id=null:null;
    this.refFeeForm = this.dialog.open (AppInvRestrictionMainFormComponent,{minHeight:'20vh', minWidth:'60vw', autoFocus: false, maxHeight: '90vh'})
    if (action==='Create') {
      this.refFeeForm.componentInstance.idportfolio.patchValue(this.idportfolios[0]);
      this.refFeeForm.componentInstance.portfolioname.patchValue(this.portCodes[0]);
    };
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
    let numberFields=[ 'id',  'idportfolio', 'restriction_type_id', 'value', 'object_id'];
    let dateFields=[];
    this.HandlingCommonTasksS.exportToExcel (this.dataSource.data,"restrictionsData",numberFields,dateFields);  
  }
}
