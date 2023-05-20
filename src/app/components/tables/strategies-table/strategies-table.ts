import {AfterViewInit, Component, EventEmitter, Output, ViewChild} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {animate, state, style, transition, trigger} from '@angular/animations';
import { StrategiesGlobalData } from 'src/app/models/intefaces';
import { AppInvestmentDataServiceService } from 'src/app/services/app-investment-data.service.service';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { AppStrategyFormComponent } from '../../forms/strategy-form/strategy-form';
import { HandlingCommonTasksService } from 'src/app/services/handling-common-tasks.service';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { AuthService } from 'src/app/services/auth.service';
import { formatNumber } from '@angular/common';
@Component({
  selector: 'app-table-strategies',
  templateUrl: './strategies-table.html',
  styleUrls: ['./strategies-table.scss'],
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
  columnsHeaderToDisplay = ['ID','Name',  'Level', 'Description', 'Benchmark'];
  columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
  dataSource: MatTableDataSource<StrategiesGlobalData>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @Output() modal_principal_parent = new EventEmitter();
  expandedElement: StrategiesGlobalData  | null;
  StrategyForm: MatDialogRef<AppStrategyFormComponent>;
  action ='';
  currentStrategy: any;

  constructor(
    private InvestmentDataService:AppInvestmentDataServiceService,
    private dialog: MatDialog,
    private AuthServiceS:AuthService,  
    private HandlingCommonTasksS:HandlingCommonTasksService,
    private CommonDialogsService:HadlingCommonDialogsService,
  ) {
    this.AuthServiceS.verifyAccessRestrictions('accessToStrategyData').subscribe ((accessData) => {
      this.accessState=accessData.elementvalue;
      this.disabledControlElements = this.accessState === 'full'? false : true;
      if (this.accessState !=='none') {
        this.InvestmentDataService.getReloadStrategyList().subscribe ( (id) => {
          this.updateStrategyData(this.action)
        })
      }
    })
  }
  async ngAfterViewInit() {
    this.columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
    this.updateStrategyData(this.action)
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
  chooseStrategy (element) {
    this.currentStrategy = element;
    this.modal_principal_parent.emit('CLOSE_PARENT_MODAL');
  }
  openStrategyForm (actionType:string, row: StrategiesGlobalData ) {
    console.log('openStrategyForm',actionType);
    this.StrategyForm = this.dialog.open(AppStrategyFormComponent ,{minHeight:'400px', maxWidth:'1000px' });
    this.StrategyForm.componentInstance.action = actionType;
    this.StrategyForm.componentInstance.title = actionType;
    this.StrategyForm.componentInstance.strategyId = row['id']
    switch (actionType) {
      case 'Create':
      case 'Create_Example': 
        this.StrategyForm.componentInstance.title = 'Create New';
      break;
      case 'View': 
        this.StrategyForm.componentInstance.editStrategyForm.disable();
        console.log('disable');
      break;
    }
  }
  async updateStrategyData (action: string) {
    return new Promise<number> (async (resolve,reject) => {
      this.dataSource? this.dataSource.data=null : null;
      this.InvestmentDataService.getGlobalStategiesList(0,'0',this.action).subscribe (portfoliosData => {
        this.dataSource  = new MatTableDataSource(portfoliosData);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        resolve (portfoliosData.length)
      })
    })
  }
  async submitQuery () {
    this.dataSource? this.dataSource.data = null : null;
    await this.updateStrategyData(this.action).then ((rowsCount) => {
      this.CommonDialogsService.snackResultHandler({name:'success',detail: formatNumber (rowsCount,'en-US') + ' rows'},'Loaded ')
    })
  }
  exportToExcel() {
    this.HandlingCommonTasksS.exportToExcel (this.dataSource.data,"StrategyData")
  }
}