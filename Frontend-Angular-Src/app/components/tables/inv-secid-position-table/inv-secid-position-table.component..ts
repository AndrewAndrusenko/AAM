import {Component, ViewChild, Input, ChangeDetectionStrategy, ElementRef, SimpleChanges} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {Observable, Subscription, distinctUntilChanged, map, startWith } from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {currencyCode, portfolioPositions } from 'Frontend-Angular-Src/app/models/interfaces.model';
import {MatChipInputEvent} from '@angular/material/chips';
import {AbstractControl, FormBuilder, Validators, FormGroup } from '@angular/forms';
import {formatNumber } from '@angular/common';
import {HadlingCommonDialogsService } from 'Frontend-Angular-Src/app/services/hadling-common-dialogs.service';
import {HandlingCommonTasksService } from 'Frontend-Angular-Src/app/services/handling-common-tasks.service';
import {AuthService } from 'Frontend-Angular-Src/app/services/auth.service';
import {AtuoCompleteService } from 'Frontend-Angular-Src/app/services/auto-complete.service';
import {AppInvestmentDataServiceService } from 'Frontend-Angular-Src/app/services/investment-data.service.service';

@Component({
  selector: 'app-inv-secid-position-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inv-secid-position-table.component.html',
  styleUrls: ['./inv-secid-position-table.component.scss'],
})
export class AppaInvSecidPositionTableComponent {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  private subscriptions = new Subscription()
  @Input() rowsPerPages:number = 15;
  @Input() secidInput:string;
  columnsToDisplay = ['portfolio_code','secid','mp_name','fact_weight','current_balance','mtm_positon','weight','planned_position','deviation_percent','order_amount','mtm_rate','total_pl','pl','unrealizedpl','cost_in_position','mtm_date','order_type','order_qty','orders_unaccounted_qty','mtm_dirty_price','cross_rate','strategy_name','cost_full_position','rate_date'];
  columnsHeaderToDisplay = ['Code','SecID','MP','Fact %','Balance','PositionMTM','MP %','MP_Position','DV%','Deviation','MTM_Rate','Total PL','FIFO PL','MTM PL','Position Cost','MTM_Date','TypeBS','Deviation Qty','Qty in Active Orders ','MTM_Dirty','CurRate','Strategy','Cost Full','CurDate']
  dataSource: MatTableDataSource<portfolioPositions>;
  @ViewChild('filterALL', {static: false}) filterALL: ElementRef;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  searchParametersFG: FormGroup;
  defaultFilterPredicate?: (data: portfolioPositions, filter: string) => boolean;
  multiFilter?: (data: portfolioPositions, filter: string) => boolean;
  filteredCurrenciesList: Observable<currencyCode[]>;
  constructor(
    private AuthService:AuthService,  
    private InvestmentDataService:AppInvestmentDataServiceService, 
    private HandlingCommonTasksS:HandlingCommonTasksService,
    private CommonDialogsService:HadlingCommonDialogsService,
    private AutoCompService:AtuoCompleteService,
    private fb:FormBuilder, 
  ) { 
    this.searchParametersFG = this.fb.group ({
      report_date : [new Date(), { validators:  Validators.required, updateOn: 'blur' }],
      report_id_currency:['840', { validators:  Validators.required}],
      secid:null,
      idportfolios:null
    });
   }
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  ngOnInit(): void {
    this.accessState = this.AuthService.accessRestrictions.filter(el =>el.elementid==='accessToTradesData')[0].elementvalue;
    this.disabledControlElements = this.accessState === 'full'? false : true;
    this.filteredCurrenciesList = this.report_id_currency.valueChanges.pipe (
      startWith (''),
      distinctUntilChanged(),
      map(value => this.AutoCompService.filterList(value || '','currency') as currencyCode[])
    );
    this.multiFilter = (data: portfolioPositions, filter: string) => {
      let filter_array = filter.split(',').map(el=>[el,1]);
      this.columnsToDisplay.forEach(col=>filter_array.forEach(fil=>{
        data[col]&&fil[0].toString().toUpperCase()===(data[col]).toString().toUpperCase()? fil[1]=0:null
      }));
      return !filter || filter_array.reduce((acc,val)=>acc+Number(val[1]),0)===0;
    }
  }
  ngOnChanges(changes: SimpleChanges) { 
    this.secid.patchValue(this.secidInput)
    this.submitQuery(false,false)
  }
  updatePositionsDataTable (positionsData:portfolioPositions[]) {
    this.dataSource  = new MatTableDataSource(positionsData);
    this.dataSource.filterPredicate =this.multiFilter
    this.filterALL? this.filterALL.nativeElement.value=null : null;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  submitQuery (reset:boolean=false, showSnackResult:boolean=true) {
    let searchObj = reset?  {} : this.searchParametersFG.value;
    this.dataSource?.data? this.dataSource.data = null : null;
    searchObj.report_date= new Date (searchObj.report_date).toDateString();
    this.InvestmentDataService.getSecIDsPositions(searchObj).subscribe(data => {
      this.updatePositionsDataTable(data)
      showSnackResult? this.CommonDialogsService.snackResultHandler({name:'success',detail: formatNumber (data.length,'en-US') + ' rows'}, 'Loaded ') : null;
    });
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
  getTotals (col:string) {
    if (this.dataSource&&this.dataSource.data) { 
      return this.dataSource.filteredData.map(el =>el.secid==='NPV'? 0: el[col]).reduce((acc, value) => acc + Number(value), 0)
    }
  }
  exportToExcel() {
    let numberFields=['notnull_npv','mtm_positon_base_cur','npv','total_pl','roi','pl','unrealizedpl','cost_in_position','idportfolio','fact_weight','current_balance','mtm_positon','weight','planned_position','order_amount','order_qty','mtm_rate','cross_rate','mtm_dirty_price','pl'];
    let dateFields=['mtm_date','rate_date'];
    this.HandlingCommonTasksS.exportToExcel (this.dataSource.data,"positionsSecidData",numberFields,dateFields);  
  }
  get  secid () {return this.searchParametersFG.get('secid') } 
  get  report_date () {return this.searchParametersFG.get('report_date') } 
  get  report_id_currency () {return this.searchParametersFG.get('report_id_currency') } 
}