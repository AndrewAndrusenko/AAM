import {AfterViewInit, Component, EventEmitter, Output, ViewChild} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {animate, state, style, transition, trigger} from '@angular/animations';
import { StrategiesGlobalData, formInitParams } from 'src/app/models/interfaces.model';
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
    action:0
  });
  columnsToDisplay = ['id','name',  'level', 'description', 'Benchmark Account','action'];
  columnsHeaderToDisplay = ['ID','Title',  'Level', 'Description', 'Benchmark','Action'];
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
  expandAllowed: boolean;

  constructor(
    private dialog: MatDialog,
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
  ngAfterViewInit() {
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
  NavigateToStrategyForm (actionType:string, row: StrategiesGlobalData ) {
    this.router.navigate(['tree/']);
    this.TreeMenuSeviceS.sendUpdate('Strategies', row.name, +row.id);
  }
  openStrategyForm (actionType:string, row: StrategiesGlobalData ) {
    this.expandAllowed = false;
    this.StrategyForm = this.dialog.open(AppStrategyFormComponent ,{minWidth:'70vw' });
    this.StrategyForm.componentInstance.action = actionType;
    actionType !=='Create'? this.StrategyForm.componentInstance.strategyId = row['id'] : null;
  }
  updateStrategyData (action: string = '',snack:boolean=false) {
    let field = 'level';
    let value = 2
      this.dataSource? this.dataSource.data=null : null;
      this.accessState ==='none'? null : 
      this.InvestmentDataService.getGlobalStategiesList(0,'0', action).subscribe (strategyData => {
      snack? this.CommonDialogsService.snackResultHandler({name:'success',detail: formatNumber (strategyData.length,'en-US') + ' rows'},'Loaded '):null;
        this.dataSource  = new MatTableDataSource(strategyData);
        if (this.strategyTableInitParams.filterData) {
          let filter = this.strategyTableInitParams.filterData
          this.dataSource.data= this.dataSource.data.filter(el => el[filter.field]===filter.value)
        }
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      })
  }
  exportToExcel() {
    this.HandlingCommonTasksS.exportToExcel (this.dataSource.data,"StrategyData")
  }
  showPortfolios($event:Event,element:StrategiesGlobalData) {
    this.expandAllowed? this.expandedElement = this.expandedElement === element ? null : element:this.expandAllowed=true;
  }
}