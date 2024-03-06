import {Component, ViewChild, Input, ChangeDetectionStrategy, ElementRef, SimpleChanges} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {Subscription} from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {StrategyStructureHistory, tableHeaders } from 'src/app/models/interfaces.model';
import {formatNumber } from '@angular/common';
import {HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import {HandlingCommonTasksService } from 'src/app/services/handling-common-tasks.service';
import {AuthService} from 'src/app/services/auth.service';
import {AppInvestmentDataServiceService} from 'src/app/services/investment-data.service.service';
@Component({
  selector: 'app-strategy_structure-hist-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './strategy_structure-hist-table.component.html',
  styleUrls: ['./strategy_structure-hist-table.component.scss'],
})
export class AppStrategyStructureHistTable {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  private subscriptions = new Subscription()
  @Input() readOnly:boolean = false;
  @Input() ModelPortfolio:number
  @Input() parentStrategyId:number
  columnsWithHeaders: tableHeaders[] = [  
    {
      "fieldName": "type_trans",
      "displayName": "Type"
    },      {
      "fieldName": "tr_date",
      "displayName": "TimeStamp"
    },
      {
        "fieldName": "id_strategy_parent",
        "displayName": "StrID"
      },
      {
        "fieldName": "id_strategy_child",
        "displayName": "SecID"
      },
      {
        "fieldName": "weight_of_child",
        "displayName": "Weight"
      },
      {
        "fieldName": "login",
        "displayName": "UserCode"
      },
      {
        "fieldName": "accessrole",
        "displayName": "UserRole"
      },
      {
        "fieldName": "user",
        "displayName": "UserID"
      }
  ]
  columnsToDisplay: string [];
  columnsHeaderToDisplay: string [];
  dataSource: MatTableDataSource<StrategyStructureHistory>;
  dataWithSorting:StrategyStructureHistory[];
  @ViewChild('filterALL', { static: false }) filterALL: ElementRef;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  rDate: Date;
  multiFilter?: (data: StrategyStructureHistory, filter: string) => boolean;
  showFilter = false;
  constructor(
    private AuthServiceS:AuthService,  
    private HandlingCommonTasksS:HandlingCommonTasksService,
    private CommonDialogsService:HadlingCommonDialogsService,
    private InvestmentDataService:AppInvestmentDataServiceService,
  ) {
    this.columnsToDisplay=this.columnsWithHeaders.map(el=>el.fieldName);
    this.columnsHeaderToDisplay=this.columnsWithHeaders.map(el=>el.displayName);
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToTradesData')[0].elementvalue;
  }
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  ngOnInit(): void {
    this.rDate = new Date('02/05/2024')
    this.disabledControlElements = this.accessState === 'full'&&this.readOnly===false? false : true;
    this.subscriptions.add (
      this.InvestmentDataService.getReloadStrategyStructure().subscribe(parentStrategyId=>{
        this.parentStrategyId===parentStrategyId? this.submitQuery(false,false):null;
      })
    )
    this.multiFilter = (data: StrategyStructureHistory, filter: string) => {
      let filter_array = filter.split(',').map(el=>[el,1]);
      this.columnsToDisplay.forEach(col=>filter_array.forEach(fil=>{
        data[col]&&fil[0].toString().toUpperCase()===(data[col]).toString().toUpperCase()? 
        fil[1]=0:null;
      }));
      return !filter || filter_array.reduce((acc,val)=>acc+Number(val[1]),0)===0;
    };
  }
  ngOnChanges(changes: SimpleChanges) {
    Object.hasOwn(changes,'parentStrategyId')&&this.parentStrategyId? this.submitQuery(false,false) : null;
  }
  updateDataTable (historyData:StrategyStructureHistory[]) {
    this.dataWithSorting = historyData;
    this.dataSource  = new MatTableDataSource(historyData);
    this.dataSource.filterPredicate =this.multiFilter;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
 submitQuery (reset:boolean=false, showSnackResult:boolean=true) {
    this.InvestmentDataService.getStrategyStructureHistory(this.parentStrategyId).subscribe(data => {
      this.updateDataTable(data)
      showSnackResult? this.CommonDialogsService.snackResultHandler({
        name:data['name'], 
        detail:data['name'] === 'error'? data['detail'] :  formatNumber (data.length,'en-US') + ' rows'}, 'Loaded ') : null;
    });
  }
  showHistoricalPortfolio (pDate:string) {
   let portfolioChanges = new Map <string,StrategyStructureHistory>()
   let reportDate = new Date (pDate)
   this.dataWithSorting.forEach(el=>{
      new Date(el.tr_date)>=reportDate? portfolioChanges.set(el.id_strategy_child,el):null
    })
  this.InvestmentDataService.sendStrategyStructureHistoryPortfolio(portfolioChanges)

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
    let dataTypes =  {
      id_strategy_parent: 'number', 
      weight_of_child : 'number',
      id_item:'number',
      id_strategy_child:'string',
      id_strategy_child_integer:'number',
      user_id:'number',
      tr_date:'Date',
      type:'number',
      user:'number',
    }
    let dataToExport =  structuredClone(this.dataSource.data);
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
    this.HandlingCommonTasksS.exportToExcel (dataToExport,"StrategyStructureHistory");  
  }
  // get  type () {return this.searchParametersFG.get('type') } 
  // get  tdate () {return this.searchParametersFG.get('tdate') } 

}

