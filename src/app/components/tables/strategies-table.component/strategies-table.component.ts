import {AfterViewInit, Component, EventEmitter, Output, ViewChild} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {animate, state, style, transition, trigger} from '@angular/animations';
import { StrategiesGlobalData, formInitParams } from 'src/app/models/intefaces.model';
import { AppInvestmentDataServiceService } from 'src/app/services/investment-data.service.service';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { AppStrategyFormComponent } from '../../forms/strategy-form.component/strategy-form.component';
import { HandlingCommonTasksService } from 'src/app/services/handling-common-tasks.service';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { AuthService } from 'src/app/services/auth.service';
import { formatNumber } from '@angular/common';
import { investmentNodeColor } from 'src/app/models/constants.model';
import { routesTreeMenu } from 'src/app/app-routing.module';
import { TreeMenuSevice } from 'src/app/services/tree-menu.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-table-strategies',
  templateUrl: './strategies-table.component.html',
  styleUrls: ['./strategies-table.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class AppTableStrategiesComponentComponent  implements AfterViewInit {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  accessToClientData: string = 'none';
  accessToPortfolioData: string = 'none';
  routesPathsTreeMenu = routesTreeMenu.map (el=>el.path)

  StrategiesGlobalDataC = (): StrategiesGlobalData => ( {
    id: 0, 
    name : '', 
    stype : 0,
    Level : 0,
    description: '', 
    s_benchmark_account: 0,
    'Benchmark Account': '', 
  });
  columnsToDisplay = ['id','name',  'level', 'description', 'Benchmark Account'];
  columnsHeaderToDisplay = ['ID','Title',  'Level', 'Description', 'Benchmark'];
  columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
  dataSource: MatTableDataSource<StrategiesGlobalData>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @Output() modal_principal_parent = new EventEmitter();
  expandedElement: StrategiesGlobalData  | null;
  StrategyForm: MatDialogRef<AppStrategyFormComponent>;
  strategyTableInitParams: formInitParams = {
    action:null,
    filterData:null,
    readOnly: null
  };
  investmentNodeColor=investmentNodeColor
  expandAllowed: any;

  constructor(
    private TreeMenuSeviceS:TreeMenuSevice, 
    private router: Router,
    private InvestmentDataService:AppInvestmentDataServiceService,
    private AuthServiceS:AuthService,  
    private HandlingCommonTasksS:HandlingCommonTasksService,
    private CommonDialogsService:HadlingCommonDialogsService,
  ) {
    this.accessToClientData = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToClientData')[0].elementvalue;
    this.accessToPortfolioData = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToPortfolioData')[0].elementvalue;
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToStrategyData')[0].elementvalue;
    this.disabledControlElements = this.accessState === 'full'? false : true;
    this.InvestmentDataService.getReloadStrategyList().subscribe (data => this.updateStrategyData(this.strategyTableInitParams.action))
  }
  async ngAfterViewInit() {
    this.columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
    this.updateStrategyData(this.strategyTableInitParams.action)
  }
  clearFilter (input:HTMLInputElement) {
    input.value=''
    this.dataSource.filter = ''
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage()}
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage();}
  }
  chooseStrategy (element:StrategiesGlobalData) {
    this.modal_principal_parent.emit(element);
  }
  openStrategyForm (actionType:string, row: StrategiesGlobalData ) {
    this.routesPathsTreeMenu.includes('Strategies')? this.router.navigate(['tree/'+'Strategies']) : null;
    this.TreeMenuSeviceS.sendUpdate('Strategies', row.name, +row.id)
  }
  async updateStrategyData (action: string = '') {
    let field = 'level';
    let value = 2
    return new Promise<number> (async (resolve,reject) => {
      this.dataSource? this.dataSource.data=null : null;
      this.accessState ==='none'? null : 
      this.InvestmentDataService.getGlobalStategiesList(0,'0', action).subscribe (strategyData => {
        this.dataSource  = new MatTableDataSource(strategyData);
        if (this.strategyTableInitParams.filterData) {
          let filter = this.strategyTableInitParams.filterData
          this.dataSource.data= this.dataSource.data.filter(el => el[filter.field]===filter.value)
        }
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        resolve (strategyData.length)
      })
    })
  }
  async submitQuery () {
    await this.updateStrategyData(this.strategyTableInitParams.action).then ((rowsCount) => {
      this.CommonDialogsService.snackResultHandler({name:'success',detail: formatNumber (rowsCount,'en-US') + ' rows'},'Loaded ')
    })
  }
  exportToExcel() {
    this.HandlingCommonTasksS.exportToExcel (this.dataSource.data,"StrategyData")
  }
  showPortfolios($event:Event,element:StrategiesGlobalData) {
    this.expandAllowed? this.expandedElement = this.expandedElement === element ? null : element:this.expandAllowed=true;
  }
}