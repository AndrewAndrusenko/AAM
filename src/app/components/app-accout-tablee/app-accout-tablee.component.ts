import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import { AccountsTableModel } from 'src/app/models/accounts-table-model';
import {AppTabServiceService} from 'src/app/services/app-tab-service.service'
@Component({
  selector: 'app-app-accout-tablee',
  templateUrl: './app-accout-tablee.component.html',
  styleUrls: ['./app-accout-tablee.component.css']
})
export class TableAccounts implements AfterViewInit {
  displayedColumns: string[] = ['idportfolio', 'portfolioname','sname', 'portleverage'];
  dataSource: MatTableDataSource<AccountsTableModel>;
  portfolios:AccountsTableModel[]
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(private AppTabServiceService:AppTabServiceService) {
    // Create 100 users
     this.AppTabServiceService.getAccountsData().subscribe (portfoliosData => {
      this.portfolios = (portfoliosData)
      this.dataSource  = new MatTableDataSource(this.portfolios);
    })
  }

  ngAfterViewInit() {
    this.AppTabServiceService.getAccountsData().subscribe (portfoliosData => {
      this.portfolios = (portfoliosData)
      this.dataSource  = new MatTableDataSource(this.portfolios);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    })
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}