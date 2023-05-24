import {Component, EventEmitter, Input, Output, SimpleChanges, ViewChild} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {AccountsTableModel } from 'src/app/models/intefaces';
import {MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import {AppNewAccountComponent } from '../../forms/new-account-form/new-account-form';
import {AppInvestmentDataServiceService } from 'src/app/services/app-investment-data.service.service';
import {AuthService } from 'src/app/services/auth.service';
import { HandlingCommonTasksService } from 'src/app/services/handling-common-tasks.service';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { formatNumber } from '@angular/common';
@Component({
  selector: 'app-app-portfolio-tablee',
  templateUrl: './portfolios-table.html',
  styleUrls: ['./portfolios-table.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class TablePortfolios {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  accessToClientData: string = 'none';
  dataSource: MatTableDataSource<AccountsTableModel>;
  expandedElement: AccountsTableModel  | null;
  columnsToDisplay : string[] = ['idportfolio', 'portfolioname','stategy_name', 'description', 'portleverage'];
  columnsToHeaderDisplay : string[] = ['ID', 'Code','Stategy', 'Stategy Title', 'Leverage'];
  columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  readOnly: boolean = true;
  selectedRow: any;
  dialogRef: MatDialogRef<AppNewAccountComponent>;
  currentAccout:any;

  @Input() clientId : number;
  @Input() strategyId : number;
  @Input() actionOnAccountTable : string;
  @Input() action : string;
  @Input() row : any;

  @Output() public modal_principal_parent = new EventEmitter();

  constructor(
    private InvestmentDataService:AppInvestmentDataServiceService, 
    private dialog: MatDialog,
    private AuthServiceS:AuthService,  
    private CommonDialogsService:HadlingCommonDialogsService,
    private HandlingCommonTasksS:HandlingCommonTasksService,
  ) 
  { }
  async updatePortfolioData (portfolioid: number, clientid:number, strategyid:number, action: string, accessToClientData:string ) {
    return new Promise<number> (async (resolve,reject) => {
      if (this.accessState !=='none') {
        this.dataSource? this.dataSource.data=null : null;
        this.InvestmentDataService.getPortfoliosData('', portfolioid,clientid,strategyid,action,accessToClientData).subscribe (portfoliosData => {
          this.dataSource  = new MatTableDataSource(portfoliosData);
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
          resolve (portfoliosData.length);
        })
      } 
    })
  }
  ngOnInit(): void {
    console.log('accessRestrictions',this.AuthServiceS.accessRestrictions);
    this.accessToClientData = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToClientData')[0].elementvalue;
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToPortfolioData')[0].elementvalue;
    console.log('this.accessState',this.accessToClientData,this.accessState);
    this.disabledControlElements = this.accessState === 'full'? false : true;
    this.updatePortfolioData (undefined, this.clientId,this.strategyId,this.actionOnAccountTable,this.accessToClientData);
    if (this.accessState !=='none') this.InvestmentDataService.getReloadPortfoliosData().subscribe((data) => {
      this.updatePortfolioData (undefined, this.clientId,this.strategyId,this.actionOnAccountTable,this.accessToClientData);
    })
  }
  ngOnChanges(changes: SimpleChanges) {
    this.updatePortfolioData (undefined, this.clientId,this.strategyId,this.actionOnAccountTable,this.accessToClientData);
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
    this.dialogRef = this.dialog.open(AppNewAccountComponent ,{minHeight:'400px', maxWidth:'1000px' });
    this.dialogRef.componentInstance.action = actionType;
    this.dialogRef.componentInstance.title = actionType;
    this.dialogRef.componentInstance.portfolioCode = row['idportfolio'];
    // this.dialogRef.componentInstance.accessToClientData = this.accessToClientData;
    switch (actionType) {
      case 'Create':
      case 'Create_Example': 
      this.dialogRef.componentInstance.title = 'Create New';
      break;
    }
  }
  async submitQuery () {
    this.dataSource? this.dataSource.data = null : null;
    await  this.updatePortfolioData (undefined,this.clientId,this.strategyId,this.actionOnAccountTable,this.accessToClientData).then ((rowsCount) => {
      this.CommonDialogsService.snackResultHandler({name:'success',detail: formatNumber (rowsCount,'en-US') + ' rows'},'Loaded ')
    })
  }
  exportToExcel() {
    this.HandlingCommonTasksS.exportToExcel (this.dataSource.data,"PortfolioData")
  }
}