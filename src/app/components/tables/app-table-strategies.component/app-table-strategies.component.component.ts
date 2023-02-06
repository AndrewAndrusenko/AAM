import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {lastValueFrom } from 'rxjs';
import {MatTableDataSource} from '@angular/material/table';
import {animate, state, style, transition, trigger} from '@angular/animations';
import { StrategiesGlobalData } from 'src/app/models/accounts-table-model';
import {TreeMenuSevice } from 'src/app/services/tree-menu.service';
import { AppInvestmentDataServiceService } from 'src/app/services/app-investment-data.service.service';
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
    Name : '', 
    stype : 0,
    Level : 0,
    Description: '', 
    s_benchmark_account: 0,
    'Benchmark Account': '', 
  });

  columnsToDisplay = ['name',  'level', 'description', 'Benchmark Account'];

  columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
  dataSource: MatTableDataSource<StrategiesGlobalData>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  expandedElement: StrategiesGlobalData  | null;
  accessToClientData: string = 'true';

  constructor(private InvestmentDataService:AppInvestmentDataServiceService, private TreeMenuSevice:TreeMenuSevice ) {}

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
}