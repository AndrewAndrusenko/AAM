import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {lastValueFrom } from 'rxjs';
import {MatTableDataSource} from '@angular/material/table';
import {animate, state, style, transition, trigger} from '@angular/animations';
import { StrategiesGlobalData } from 'src/app/models/accounts-table-model';
import {TreeMenuSevice } from 'src/app/services/tree-menu.service';
import { AppInvestmentDataServiceService } from 'src/app/services/app-investment-data.service.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AppConfimActionComponent } from '../../alerts/app-confim-action/app-confim-action.component';
import { AppStrategyFormComponent } from '../../forms/app-strategy-form/app-strategy-form.component';
@Component({
  selector: 'app-table-strategies',
  templateUrl: './app-table-strategies.component.component.html',
  styleUrls: ['./app-table-strategies.component.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class AppTableStrategiesComponentComponent  implements AfterViewInit {
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

  columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
  dataSource: MatTableDataSource<StrategiesGlobalData>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  expandedElement: StrategiesGlobalData  | null;
  accessToClientData: string = 'true';
  // isEditForm: boolean = false;
  dialogRef: MatDialogRef<AppStrategyFormComponent>;
  dtOptions: any = {};
  action ='';
  public row: any;
  constructor(private InvestmentDataService:AppInvestmentDataServiceService, private TreeMenuSevice:TreeMenuSevice, private dialog: MatDialog ) {}

  async ngAfterViewInit() {
    console.log('this.StrategiesGlobalDataC',this.StrategiesGlobalDataC());
    // this.columnsToDisplay = Object.keys (this.StrategiesGlobalDataC());
    console.log('this.columnsToDisplay',this.columnsToDisplay);
    this.columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
    let userData = JSON.parse(localStorage.getItem('userInfo'))
    await lastValueFrom (this.TreeMenuSevice.getaccessRestriction (userData.user.accessrole, 'accessToClientData'))
    .then ((accessRestrictionData) =>{
      this.accessToClientData = accessRestrictionData['elementvalue']
      console.log('accessToClientData',this.accessToClientData);
      this.InvestmentDataService.getGlobalStategiesList(0,'0','0').subscribe (portfoliosData => {
        this.dataSource  = new MatTableDataSource(portfoliosData);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      })
    })
    console.log('accessToClientData',this.accessToClientData);
 
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage();}
  }

  
  openStrategyForm (actionType:string, row: any ) {
    console.log('row', row);
    this.dialogRef = this.dialog.open(AppStrategyFormComponent ,{minHeight:'400px', maxWidth:'1000px' });
    this.dialogRef.componentInstance.action = actionType;
    this.dialogRef.componentInstance.title = actionType;
    this.dialogRef.componentInstance.data = row;
    
    console.log('action',actionType);
    switch (actionType) {
      case 'Create':
      case 'Create_Example': 
      this.dialogRef.componentInstance.title = 'Create New';
      break;
      /* case 'Update':
      break;
      case 'Delete':
      break; */
    }

  }
}