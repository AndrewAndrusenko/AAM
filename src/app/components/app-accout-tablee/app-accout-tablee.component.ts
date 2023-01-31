import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {lastValueFrom } from 'rxjs';
import {MatTableDataSource} from '@angular/material/table';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {AccountsTableModel } from 'src/app/models/accounts-table-model';
import {AppTabServiceService} from 'src/app/services/app-tab-service.service';
import {TreeMenuSevice } from 'src/app/services/tree-menu.service';
@Component({
  selector: 'app-app-accout-tablee',
  templateUrl: './app-accout-tablee.component.html',
  styleUrls: ['./app-accout-tablee.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class TableAccounts implements AfterViewInit {
  columnsToDisplay : string[] = ['account_id', 'account_name','strategy', 'leverage'];
  columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
  dataSource: MatTableDataSource<AccountsTableModel>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  expandedElement: AccountsTableModel  | null;
  accessToClientData: string = 'true';

  constructor(private AppTabServiceService:AppTabServiceService, private TreeMenuSevice:TreeMenuSevice ) {}

  async ngAfterViewInit() {
    
    let userData = JSON.parse(localStorage.getItem('userInfo'))
    await lastValueFrom (this.TreeMenuSevice.getaccessRestriction (userData.user.accessrole, 'accessToClientData'))
    .then ((accessRestrictionData) =>{
      this.accessToClientData = accessRestrictionData['elementvalue']
      console.log('accessToClientData',this.accessToClientData);
      this.AppTabServiceService.getAccountsData().subscribe (portfoliosData => {
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