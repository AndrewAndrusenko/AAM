import {Component, ViewChild, Input, ChangeDetectionStrategy, ElementRef} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {Subscription, filter, from,  map,  of, switchMap, tap } from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {StrategiesGlobalData, tableHeaders } from 'src/app/models/interfaces.model';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {MatChipInputEvent} from '@angular/material/chips';
import {AbstractControl, FormBuilder, Validators, FormGroup, FormControl } from '@angular/forms';
import {formatNumber } from '@angular/common';
import {HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import {HandlingCommonTasksService } from 'src/app/services/handling-common-tasks.service';
import {AuthService } from 'src/app/services/auth.service';
import {AppInvestmentDataServiceService } from 'src/app/services/investment-data.service.service';
import {AppFeesHandlingService } from 'src/app/services/fees-handling.service';
import {ManagementFeeCalcData } from 'src/app/models/fees-interfaces.model';
import {AtuoCompleteService } from 'src/app/services/auto-complete.service';
@Component({
  selector: 'app-acc-fees-management-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './acc-fees-management-calculation-table.component.html',
  styleUrls: ['./acc-fees-management-calculation-table.component.scss'],
})
export class AppaIAccFeesManagementTableComponent {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  private subscriptions = new Subscription()
  @Input() readOnly:boolean = false;
  columnsWithHeaders: tableHeaders[] = [
    {fieldName:'report_date',displayName:'Date'},
    {fieldName:'portfolioname',displayName:'Code'},
    {fieldName:'management_fee_amount',displayName:'Fee'},
    {fieldName:'npv',displayName:'NPV'},
    {fieldName:'calculation_start',displayName:'Start'},
    {fieldName:'calculation_end',displayName:'End'},
    {fieldName:'schedule_range',displayName:'Range Fee'},
    {fieldName:'feevalue',displayName:'Fee Rate'},
    {fieldName:'id_fee_transaction',displayName:'ID Calc'},
  ];
  columnsToDisplay: string [];
  columnsHeaderToDisplay: string [];
  dataSource: MatTableDataSource<ManagementFeeCalcData>;
  fullDataSource: ManagementFeeCalcData[];
  @ViewChild('filterALL', { static: false }) filterALL: ElementRef;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  dataRange = new FormGroup ({
    dateRangeStart: new FormControl<Date | null>(new Date()),
    dateRangeEnd: new FormControl<Date | null>(new Date()),
  });
  searchParametersFG: FormGroup;
  multiFilter?: (data: ManagementFeeCalcData, filter: string) => boolean;
  mp_strategies_list: StrategiesGlobalData[]=[];
  portfolios: Array<string> = ['ClearAll'];
  currencySymbol: string = '$';
  detailedView:boolean = false;
  constructor(
    private AuthServiceS:AuthService,  
    private AutoCompleteService:AtuoCompleteService,
    private InvestmentDataService:AppInvestmentDataServiceService, 
    private HandlingCommonTasksS:HandlingCommonTasksService,
    private CommonDialogsService:HadlingCommonDialogsService,
    private AppFeesHandlingService:AppFeesHandlingService,
    private fb:FormBuilder, 
  ) {
    this.columnsToDisplay=this.columnsWithHeaders.map(el=>el.fieldName);
    this.columnsHeaderToDisplay=this.columnsWithHeaders.map(el=>el.displayName);
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToFeesData')[0].elementvalue;
    this.disabledControlElements = this.accessState === 'full'? false : true;
    this.dateRangeStart.value.setMonth(this.dateRangeStart.value.getMonth()-1);
    this.searchParametersFG = this.fb.group ({
      p_portfolios_list:  [],
      MP:null,
      p_report_date_start:null,
      p_report_date_end:null,
    });
  }
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  ngOnInit(): void {
    this.AutoCompleteService.getModelPotfoliosList();
    this.subscriptions.add(
      this.AutoCompleteService.getSMPsListReady().subscribe(data=>this.mp_strategies_list=data)
    )
    this.multiFilter = (data: ManagementFeeCalcData, filter: string) => {
      let filter_array = filter.split(',').map(el=>[el,1]);
      this.columnsToDisplay.forEach(col=>filter_array.forEach(fil=>{
        data[col]&&fil[0].toString().toUpperCase()===(data[col]).toString().toUpperCase()? fil[1]=0:null
      })
        );
      return !filter || filter_array.reduce((acc,val)=>acc+Number(val[1]),0)===0;
    };
  }
  resetSearchForm () {
    this.searchParametersFG.reset();
    this.portfolios=['ClearAll'];
  }
  setPortfoliosList(mp:string) {
    this.InvestmentDataService.getPortfoliosListForMP(mp,'getPortfoliosByMP_StrtgyID').subscribe(data=>{
      this.portfolios=['ClearAll',...data]
      this.filterALL.nativeElement.value = mp;
    })
  }
  updateDataTable (managementFeeData:ManagementFeeCalcData[]) {
    this.fullDataSource=managementFeeData;
    this.dataSource  = new MatTableDataSource(managementFeeData);
    this.dataSource.filterPredicate =this.multiFilter
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.portfolios = ['ClearAll',...new Set(this.fullDataSource.map(el=>el.portfolioname))]

  }
  submitQuery ( reset:boolean=false, showSnackResult:boolean=true) {
    let searchObj = reset?  {} : this.searchParametersFG.value;
    this.dataSource?.data? this.dataSource.data = null : null;
    searchObj.p_report_date_start = new Date (this.dateRangeStart.value).toLocaleDateString();
    searchObj.p_report_date_end = this.dateRangeEnd.value? new Date (this.dateRangeEnd.value).toLocaleDateString(): new Date().toLocaleDateString();
    of(this.portfolios.length).pipe(
      switchMap(portLength => 
        portLength===1? 
          this.InvestmentDataService.getPortfoliosListForMP('All','getPortfoliosByMP_StrtgyID')
          :from([[...this.portfolios]])
      ),
      tap(ports=>searchObj.p_portfolios_list = ports.map(el=>el.toUpperCase())),
      switchMap(()=>this.AppFeesHandlingService.getManagementFeeCalcData(searchObj))
    ).subscribe(data => {
      this.updateDataTable(data)
      showSnackResult? this.CommonDialogsService.snackResultHandler({
        name:data['name'], 
        detail:data['name'] === 'error'? data['detail'] :  formatNumber (data.length,'en-US') + ' rows'}, 'Loaded ') : null;
    });
  }
  showCalcDetails (details:boolean) {
    this.dataSource.data = this.fullDataSource.filter(el=>details? el.npv === null:el.npv !== null)
  }
  approveCalculation () {
    let searchObj  = this.searchParametersFG.value;
    searchObj.p_report_date_start = new Date (this.dateRangeStart.value).toLocaleDateString();
    searchObj.p_report_date_end = this.dateRangeEnd.value? new Date (this.dateRangeEnd.value).toLocaleDateString(): new Date().toLocaleDateString();
    let countSavedCalcs = this.dataSource.data.filter(el=>el.id_fee_transaction>0).length
     if (countSavedCalcs===this.dataSource.data.filter(el=>el.npv>0).length) { 
      return this.CommonDialogsService.snackResultHandler({name:'error',detail:'Nothing to save. All calculations have already been saved'})
    }
    of(this.portfolios.length).pipe(
      switchMap(portLength => 
        portLength===1? 
        this.InvestmentDataService.getPortfoliosListForMP('All','getPortfoliosByMP_StrtgyID')
        :from([[...this.portfolios]])
      ),
      tap(ports=>searchObj.p_portfolios_list = ports.map(el=>el.toUpperCase())),
      switchMap(()=>
        countSavedCalcs? 
        this.CommonDialogsService.confirmDialog('There are already saved calculations in the current list.\n Create only new caluculations (without ID Calc)?','Create new')
        :from([{isConfirmed:true}])
      ),
      filter(confirm=>confirm.isConfirmed),
      switchMap(()=>this.AppFeesHandlingService.approvedManagementFeeCalc(searchObj))
    ).subscribe(data => {
      this.submitQuery(false,false);
      this.CommonDialogsService.snackResultHandler({
        name:data['name'],detail: data['name'] === 'error'? 
        data['detail'] : formatNumber (data[0].f_f_insert_management_fees,'en-US') + ' rows'}, 'Inserted ');
    });

  }
  changedValueofChip (value:string, chipArray:string[]) {
    chipArray[chipArray.length-1] === 'ClearAll'? chipArray.push(value) : chipArray[chipArray.length-1] = value
  }
  add(event: MatChipInputEvent,chipArray:string[]): string[] {
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
  exportToExcel() {
    let dataTypes =  {
      report_date : 'Date',
      id_portfolio : 'number',
      management_fee_amount : 'number',
      npv : 'number',
      calculation_start : 'Date',
      calculation_end : 'Date',
      period_start : 'Date',
      period_end : 'Date',
      feevalue : 'number',
      fee_type_value  :'number',
      id_fee_transaction:'number'
    }
    let dataToExport =  structuredClone(this.fullDataSource);
    dataToExport.map(el=>{
      Object.keys(el).forEach(key=>{
        switch (true==true) {
          case el[key]&&dataTypes[key]==='number': return el[key]=Number(el[key])
          case el[key]&&dataTypes[key]==='Date': return el[key]=new Date(el[key])
          default: return el[key]=el[key]
        }
      })
      return el;
    });
    this.HandlingCommonTasksS.exportToExcel (dataToExport,"managementFeeData");  
  }
  get  idportfolios () {return this.searchParametersFG.get('p_portfolios_list') } 
  get  dateRangeStart () {return this.dataRange.get('dateRangeStart') } 
  get  dateRangeEnd () {return this.dataRange.get('dateRangeEnd') } 
  get  dataRangeSF () {return this.searchParametersFG.get('dataRangeSF') } 
}
