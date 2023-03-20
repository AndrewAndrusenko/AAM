import {AfterViewInit, Component, EventEmitter, Input, Output, SimpleChanges, ViewChild} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {lastValueFrom, Subscription } from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {AccountsTableModel } from 'src/app/models/accounts-table-model';
import {AppTabServiceService} from 'src/app/services/app-tab-service.service';
import {TreeMenuSevice } from 'src/app/services/tree-menu.service';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { AppNewAccountComponent } from '../../forms/app-new-account/app-new-account.component';
import { AppInvestmentDataServiceService } from 'src/app/services/app-investment-data.service.service';
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
  columnsToDisplay : string[] = ['idportfolio', 'portfolioname','stategy_name', 'description', 'portleverage'];

  columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  expandedElement: AccountsTableModel  | null;
  accessToClientData: string = 'true';
  public readOnly: boolean = true;
  public selectedRow: any;
  dialogRef: MatDialogRef<AppNewAccountComponent>;
  public currentAccout:any;
  private subscriptionName: Subscription;

  @Input() clientId : number;
  @Input() strategyId : number;
  @Input() actionOnAccountTable : string;
  @Input() action : string;

  @Output() public modal_principal_parent = new EventEmitter();

  constructor(private AppTabServiceService:AppTabServiceService, private TreeMenuSevice:TreeMenuSevice, private  InvestmentDataService:AppInvestmentDataServiceService, private dialog: MatDialog ) {
    this.subscriptionName= this.InvestmentDataService.getReloadStrategyList().subscribe ( (id) => {
      console.log('messageAA', id )
      this.AppTabServiceService.getAccountsData (this.clientId,this.strategyId,'', this.actionOnAccountTable).subscribe (portfoliosData => {
        console.log('portfoliosData', portfoliosData);
        this.dataSource  = new MatTableDataSource(portfoliosData);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      })
    } )
  }

  async ngAfterViewInit() {
    let userData = JSON.parse(localStorage.getItem('userInfo'))
    await lastValueFrom (this.TreeMenuSevice.getaccessRestriction (userData.user.accessrole, 'accessToClientData'))
    .then ((accessRestrictionData) =>{
      this.accessToClientData = accessRestrictionData['elementvalue']
      this.AppTabServiceService.getAccountsData(this.clientId,this.strategyId,'', this.actionOnAccountTable).subscribe (portfoliosData => {
        this.dataSource  = new MatTableDataSource(portfoliosData);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      })
    })
  }
  ngOnChanges(changes: SimpleChanges) {
    this.AppTabServiceService.getAccountsData(this.clientId,this.strategyId,'', this.actionOnAccountTable).subscribe (portfoliosData => {
      this.dataSource  = new MatTableDataSource(portfoliosData);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    })
  }
    
  chooseAccount (element) {
    this.currentAccout = element;
    this.selectedRow = element;
    this.modal_principal_parent.emit('CLOSE_PARENT_MODAL');
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage();}
  }

  openAccountForm (actionType:string, row: any ) {
    console.log('row', row);
    this.dialogRef = this.dialog.open(AppNewAccountComponent ,{minHeight:'400px', maxWidth:'1000px' });
    this.dialogRef.componentInstance.action = actionType;
    this.dialogRef.componentInstance.title = actionType;
    this.dialogRef.componentInstance.clientData = row;
    switch (actionType) {
      case 'Create':
      case 'Create_Example': 
      this.dialogRef.componentInstance.title = 'Create New';
      break;
    }
  }
}