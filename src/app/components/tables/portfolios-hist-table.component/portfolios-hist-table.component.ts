import {Component, ViewChild, Input, ChangeDetectionStrategy, ElementRef, SimpleChanges} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {Subscription} from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {PortfoliosHistory, tableHeaders } from 'src/app/models/interfaces.model';
import {formatNumber } from '@angular/common';
import {HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import {HandlingCommonTasksService } from 'src/app/services/handling-common-tasks.service';
import {AuthService} from 'src/app/services/auth.service';
import {AppInvestmentDataServiceService} from 'src/app/services/investment-data.service.service';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
@Component({
  selector: 'app-portfolios-hist-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './portfolios-hist-table.component.html',
  styleUrls: ['./portfolios-hist-table.component.scss'],
})
export class AppPortfoliosHistTable {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  private subscriptions = new Subscription()
  @Input() readOnly:boolean = false;
  @Input() idportfolio:number
  columnsWithHeaders: tableHeaders[] = [  
    {
      "fieldName": "type_trans",
      "displayName": "Type"
    },      {
      "fieldName": "transaction_date",
      "displayName": "TimeStamp"
    },
      {
        "fieldName": "idportfolio",
        "displayName": "ID"
      },
      {
        "fieldName": "portfolioname",
        "displayName": "Code"
      },
      {
        "fieldName": "strategy_name",
        "displayName": "Stategy"
      },
      {
        "fieldName": "clientname",
        "displayName": "Client"
      },
      {
        "fieldName": "accessrole",
        "displayName": "UserRole"
      },
      {
        "fieldName": "login",
        "displayName": "UserName"
      },
      {
        "fieldName": "user",
        "displayName": "UserID"
      }
  ]
  columnsToDisplay: string [];
  columnsHeaderToDisplay: string [];
  dataSource: MatTableDataSource<PortfoliosHistory>;
  dataWithSorting:PortfoliosHistory[];
  searchParametersFG :FormGroup
  @ViewChild('filterALL', { static: false }) filterALL: ElementRef;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  dataRange = new FormGroup ({
    dateRangeStart: new FormControl<Date | null>(null),
    dateRangeEnd: new FormControl<Date | null>(null),
  });
  multiFilter?: (data: PortfoliosHistory, filter: string) => boolean;
  showFilter = false;
  constructor(
    private AuthServiceS:AuthService,  
    private HandlingCommonTasksS:HandlingCommonTasksService,
    private CommonDialogsService:HadlingCommonDialogsService,
    private InvestmentDataService:AppInvestmentDataServiceService,
    private fb:FormBuilder
  ) {
    this.columnsToDisplay=this.columnsWithHeaders.map(el=>el.fieldName);
    this.columnsHeaderToDisplay=this.columnsWithHeaders.map(el=>el.displayName);
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToTradesData')[0].elementvalue;
    this.searchParametersFG = this.fb.group ({
      p_type:null,
      p_idportfolio:null,
      p_user_id:null,
      p_tr_date:this.dataRange
    });
  }
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  ngOnInit(): void {
    this.disabledControlElements = this.accessState === 'full'&&this.readOnly===false? false : true;
    this.multiFilter = (data: PortfoliosHistory, filter: string) => {
      let filter_array = filter.split(',').map(el=>[el,1]);
      this.columnsToDisplay.forEach(col=>filter_array.forEach(fil=>{
        data[col]&&fil[0].toString().toUpperCase()===(data[col]).toString().toUpperCase()? 
        fil[1]=0:null;
      }));
      return !filter || filter_array.reduce((acc,val)=>acc+Number(val[1]),0)===0;
    };
  }
  ngOnChanges(changes: SimpleChanges) {
    Object.hasOwn(changes,'idportfolio')&&this.idportfolio? this.submitQuery(false,false) : null;
  }
  updateDataTable (historyData:PortfoliosHistory[]) {
    this.dataWithSorting = historyData;
    this.dataSource  = new MatTableDataSource(historyData);
    this.dataSource.filterPredicate =this.multiFilter;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
 submitQuery (reset:boolean=false, showSnackResult:boolean=true) {
  this.p_idportfolio.patchValue(this.idportfolio)
  let searchParams = this.searchParametersFG.value
  searchParams.p_tr_date =this.HandlingCommonTasksS.toDateRangeNew(this.p_tr_date);
  this.InvestmentDataService.getPortfoliosHistory(searchParams).subscribe(data => {
    this.updateDataTable(data)
    showSnackResult? this.CommonDialogsService.snackResultHandler({
      name:data['name'], 
      detail:data['name'] === 'error'? data['detail'] :  formatNumber (data.length,'en-US') + ' rows'}, 'Loaded ') : null;
  });
  }
  updateFilter (el: string) {
    this.filterALL.nativeElement.value = this.filterALL.nativeElement.value + el+',';
    this.dataSource.filter = this.filterALL.nativeElement.value.slice(0,-1).trim().toLowerCase();
    (this.dataSource.paginator)? this.dataSource.paginator.firstPage() : null;
  }
  applyFilter(event: KeyboardEvent) {
    this.showFilter=true;
    const filterValue = (event.target as HTMLInputElement).value 
    this.dataSource.filter = filterValue.trim().toLowerCase();
    this.dataSource.paginator? this.dataSource.paginator.firstPage():null;
  }
  clearFilter (input:HTMLInputElement) {
    this.showFilter=false;
    input.value=''
    this.dataSource.filter = ''
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage()}
  }
  exportToExcel() {
    this.HandlingCommonTasksS.exportToExcel (this.dataSource.data,"PortfoliosHistory",['id'],[]);  
   }
   get  p_tr_date () {return this.searchParametersFG.get('p_tr_date') } 
   get  p_idportfolio () {return this.searchParametersFG.get('p_idportfolio') } 


}

