import {AfterViewInit, Component, EventEmitter, Input, Output, SimpleChanges, ViewChild} from '@angular/core';
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
  templateUrl: './app-table-accout.component.html',
  styleUrls: ['./app-table-accout.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class TableAccounts implements AfterViewInit {
  dataSource: MatTableDataSource<AccountsTableModel>;
  columnsToDisplay : string[] = ['account_id', 'account_name','strategy', 'leverage'];
  columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  expandedElement: AccountsTableModel  | null;
  accessToClientData: string = 'true';
  public currentAccout:any;
  @Input() clientId : number;
  @Input() strategyId : number;
  @Input() actionOnAccountTable : string;
  @Output() public modal_principal_parent = new EventEmitter();


  constructor(private AppTabServiceService:AppTabServiceService, private TreeMenuSevice:TreeMenuSevice ) {}

  async ngAfterViewInit() {
    
    let userData = JSON.parse(localStorage.getItem('userInfo'))
    await lastValueFrom (this.TreeMenuSevice.getaccessRestriction (userData.user.accessrole, 'accessToClientData'))
    .then ((accessRestrictionData) =>{
      this.accessToClientData = accessRestrictionData['elementvalue']
      console.log('accessToClientData',this.accessToClientData);
      this.AppTabServiceService.getAccountsData(this.clientId,this.strategyId,this.actionOnAccountTable).subscribe (portfoliosData => {
        this.dataSource  = new MatTableDataSource(portfoliosData);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      })
    })
    console.log('accessToClientData',this.accessToClientData);
 
  }
  ngOnChanges(changes: SimpleChanges) {
    console.log('changes',changes);
    this.AppTabServiceService.getAccountsData(this.clientId,this.strategyId,this.actionOnAccountTable).subscribe (portfoliosData => {
      this.dataSource  = new MatTableDataSource(portfoliosData);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    })
  }
    
  chooseAccount (element) {
    console.log('chose account', element);
    this.currentAccout = element;
    this.modal_principal_parent.emit('CLOSE_PARENT_MODAL');

    
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage();}
  }
}