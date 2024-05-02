import {Component, EventEmitter, Output, ViewChild, Input, ChangeDetectionStrategy, ElementRef, SimpleChanges} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {Subscription, filter, tap } from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {StrategiesGlobalData, tableHeaders } from 'src/app/models/interfaces.model';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {MatChipInputEvent} from '@angular/material/chips';
import {AbstractControl, FormBuilder, FormGroup } from '@angular/forms';
import {formatNumber } from '@angular/common';
import {HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import {HandlingCommonTasksService } from 'src/app/services/handling-common-tasks.service';
import {AuthService } from 'src/app/services/auth.service';
import {AtuoCompleteService } from 'src/app/services/auto-complete.service';
import {AppInvestmentDataServiceService } from 'src/app/services/investment-data.service.service';
import {MatCheckbox } from '@angular/material/checkbox';
import {MatSelectChange } from '@angular/material/select';
import {restrictionsVerification } from 'src/app/models/restrictions-interfaces.model';
import {AppRestrictionsHandlingService } from 'src/app/services/restrictions-handling.service';
interface localFilters {
  reset?:boolean,
  portfolio_code?:string[],
  null_data?:boolean,
  rest?:boolean
}
@Component({
  selector: 'app-inv-restriction-verify-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inv-restriction-verify-table.component.html',
  styleUrls: ['./inv-restriction-verify-table.component.scss'],
})
export class AppInvRestrictionVerifyTableComponent {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  private subscriptions = new Subscription()
  @Input() useGetClientsPortfolios:boolean = false;
  @Input() rowsPerPages:number = 15;
  @Input() filters:localFilters;
  @Input() readOnly:boolean = false;
  @Input() UI_portfolio_selection:boolean = true;
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
  dataSource: MatTableDataSource<restrictionsVerification>;
  fullDataSource: restrictionsVerification[];
  @ViewChild('filterALL', { static: false }) filterALL: ElementRef;
  @ViewChild('onlyViolations') onlyViolations: MatCheckbox;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  portfolios: string[] = ['ClearAll'];
  searchParametersFG: FormGroup;
  defaultFilterPredicate?: (data: restrictionsVerification, filter: string) => boolean;
  multiFilter?: (data: restrictionsVerification, filter: string) => boolean;
  mp_strategies_list: StrategiesGlobalData[]=[];
  constructor(
    private AuthService:AuthService,  
    private restrictionsHandlingService:AppRestrictionsHandlingService,
    private InvestmentDataService:AppInvestmentDataServiceService, 
    private HandlingCommonTasksS:HandlingCommonTasksService,
    private CommonDialogsService:HadlingCommonDialogsService,
    private AutoCompService:AtuoCompleteService,
    private fb:FormBuilder, 
  ) {
    this.accessState = this.AuthService.accessRestrictions.filter(el =>el.elementid==='accessToTradesData')[0].elementvalue;
    this.disabledControlElements = this.accessState === 'full'? false : true;
    this.columnsToDisplay=this.columnsWithHeaders.map(el=>el.fieldName);
    this.columnsHeaderToDisplay=this.columnsWithHeaders.map(el=>el.displayName);
    this.searchParametersFG = this.fb.group ({
      idportfolios:  [],
      MP:null    
    });
    this.AutoCompService.subModelPortfoliosList.next(true);
    this.subscriptions.add(
      this.AutoCompService.getSMPsListReady().subscribe(data=>this.mp_strategies_list=data))
  }
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    let a='ddd'.toLocaleUpperCase
  }
  ngOnInit(): void {
    if (this.useGetClientsPortfolios===true) {
      this.subscriptions.add(this.InvestmentDataService.getClientsPortfolios().pipe(
        tap(() => this.dataSource? this.dataSource.data = null: null),
        tap(portfolios => portfolios.length===0?  this.filters = {null_data:true}: null),
        filter(portfolios=>portfolios.length>0)
      ).subscribe(portfoliosData=> {
        this.filters = {portfolio_code: portfoliosData.map(el=>el.code)};
        this.setFilters (this.filters);
      }));
    }
    this.multiFilter = (data: restrictionsVerification, filter: string) => {
      let filter_array = filter.split(',').map(el=>[el,1]);
      this.columnsToDisplay.forEach(col=>filter_array.forEach(fil=>{
        data[col]&&fil[0].toString().toUpperCase()===(data[col]).toString().toUpperCase()? fil[1]=0:null
      })
        );
      return !filter || filter_array.reduce((acc,val)=>acc+Number(val[1]),0)===0;
    }
  }
  setPortfoliosList(e:MatSelectChange) {
    this.InvestmentDataService.getPortfoliosListForMP(e.value,'getPortfoliosByMP_StrtgyID').subscribe(data=>{
      this.portfolios=['ClearAll',...data]
      this.filterALL.nativeElement.value = e.value;
      (this.dataSource?.paginator)? this.dataSource.paginator.firstPage() : null;
    })
  }
  initialFilterOfDataSource (filter:localFilters) {
    if (filter?.rest===true) {
      this.dataSource.data = this.fullDataSource;
      return;
    }
    if (filter?.null_data===true) {
      this.dataSource.data=null;
    } else {
    Object.keys(filter).every(key=>{
      this.dataSource.data = this.fullDataSource.filter(el=>filter[key].includes(el[key]))
      if (this.dataSource.data.length) {return false}  else return true;
     })
    }
  }
  ngOnChanges(changes: SimpleChanges) {
    changes['filters']?.currentValue? this.setFilters(changes['filters']?.currentValue) : null;
  }
  setFilters (filters:localFilters) {
    filters.portfolio_code? this.portfolios =['ClearAll',...filters.portfolio_code]:null;
    this.submitQuery(false,false);
  }
  updateRestrictionVerifyTable (positionsData:restrictionsVerification[]) {
    this.dataSource  = new MatTableDataSource(positionsData);
    this.dataSource.filterPredicate =this.multiFilter
    this.filterALL? this.filterALL.nativeElement.value=null : null;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

  }
  submitQuery (reset:boolean=false, showSnackResult:boolean=true) {
    this.dataSource?.data? this.dataSource.data = null : null;
    this.restrictionsHandlingService.getRestrictionsVerification(this.portfolios.map(el=>el.toLocaleLowerCase())).subscribe(data => {
      this.fullDataSource = data;
      this.updateRestrictionVerifyTable(data)
      this.showOnlyViolations(true);
      this.onlyViolations.checked=true;
      showSnackResult? this.CommonDialogsService.snackResultHandler({name:'success',detail: formatNumber (data.length,'en-US') + ' rows'}, 'Loaded ') : null;
    });
  }
  showOnlyViolations (checked:boolean) {
    this.updateRestrictionVerifyTable( checked? this.fullDataSource.filter(el=>el.act_violation>0||el.act_violation_and_orders>0||el.mp_violation>0):this.fullDataSource);
  }
  changedValueofChip (value:string, chipArray:string[],control:AbstractControl) {
    chipArray[chipArray.length-1] === 'ClearAll'? chipArray.push(value) : chipArray[chipArray.length-1] = value
  }
  add(event: MatChipInputEvent,chipArray:string[],control:AbstractControl): string[] {
    const value = (event.value || '').trim();
    const valueArray = event.value.split(',');
    (value)? chipArray = [...chipArray,...valueArray] : null;
    event.chipInput!.clear();
    return chipArray;
  }
  remove(account: string, chipArray:string[],control:AbstractControl): void {
    const index = chipArray.indexOf(account);
    (index >= 0)? chipArray.splice(index, 1) : null;
  }
  clearAll(event, chipArray:string[],control:AbstractControl) : string [] {
    if (event.target.textContent.trim() === 'ClearAll') {
      chipArray = ['ClearAll'];
    };
    return chipArray;
  }
  filterBySecid (ev:MatSelectChange) {
    this.filterALL.nativeElement.value = '';
    this.updateFilter (ev.value);
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
      "net_orders"
    ];
    let dateFields=[];
    this.HandlingCommonTasksS.exportToExcel (this.dataSource.data,"restrictionVerification",numberFields,dateFields);  
  }
  get  idportfolios () {return this.searchParametersFG.get('idportfolios') } 
  get  report_date () {return this.searchParametersFG.get('report_date') } 
  get  report_id_currency () {return this.searchParametersFG.get('report_id_currency') } 
}