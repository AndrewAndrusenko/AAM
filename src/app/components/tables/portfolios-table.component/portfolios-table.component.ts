import {Component, EventEmitter, Input, Output, SimpleChanges, ViewChild} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {AccountsTableModel } from 'src/app/models/intefaces.model';
import {MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import {AppNewAccountComponent } from '../../forms/portfolio-form.component/portfolio-form.component';
import {AppInvestmentDataServiceService } from 'src/app/services/investment-data.service.service';
import {AuthService } from 'src/app/services/auth.service';
import { HandlingCommonTasksService } from 'src/app/services/handling-common-tasks.service';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { formatNumber } from '@angular/common';
import { investmentNodeColor } from 'src/app/models/constants.model';
@Component({
  selector: 'app-portfolio-tablee',
  templateUrl: './portfolios-table.component.html',
  styleUrls: ['./portfolios-table.component.css'],
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
  dialogRef: MatDialogRef<AppNewAccountComponent>;
  @Input() clientId: number;
  @Input() strategyId: number;
  @Input() actionOnAccountTable: string;
  @Input() action: string;
  @Input() row: any;
  @Output() public modal_principal_parent = new EventEmitter();
  investmentNodeColor=investmentNodeColor
  expandAllowed: boolean;
  constructor(
    private InvestmentDataService:AppInvestmentDataServiceService, 
    private dialog: MatDialog,
    private AuthServiceS:AuthService,  
    private CommonDialogsService:HadlingCommonDialogsService,
    private HandlingCommonTasksS:HandlingCommonTasksService
  ) 
  { }
  async updatePortfolioData (portfolioid: number, clientid:number, strategyid:number, action: string, accessToClientData:string ) {
    return new Promise<number> (async (resolve) => {
      if (this.accessState !=='none') {
        this.dataSource? this.dataSource.data=null : null;
        this.InvestmentDataService.getPortfoliosData('', portfolioid,clientid,strategyid,action,accessToClientData).subscribe (portfoliosData=>{
          this.dataSource  = new MatTableDataSource(portfoliosData);
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
          resolve (portfoliosData.length);
        })
      } 
    })
  }
  ngOnInit(): void {
    this.accessToClientData = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToClientData')[0].elementvalue;
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToPortfolioData')[0].elementvalue;
    this.disabledControlElements = this.accessState === 'full'? false : true;
    this.updatePortfolioData (undefined, this.clientId,this.strategyId,this.actionOnAccountTable,this.accessToClientData);
    if (this.accessState !=='none') this.InvestmentDataService.getReloadPortfoliosData().subscribe(data => this.updatePortfolioData (undefined, this.clientId,this.strategyId,this.actionOnAccountTable,this.accessToClientData));
  }
  ngOnChanges(changes: SimpleChanges) {
    this.updatePortfolioData (undefined, this.clientId,this.strategyId,this.actionOnAccountTable,this.accessToClientData);
  }
  chooseAccount (element) {
    this.modal_principal_parent.emit(element);
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage();}
  }
  openAccountForm (actionType:string, row: any ) {
    this.expandAllowed = false;
    this.dialogRef = this.dialog.open(AppNewAccountComponent ,{minHeight:'400px', maxWidth:'1000px' });
    this.dialogRef.componentInstance.action = actionType;
    this.dialogRef.componentInstance.portfolioCode = Number(row['idportfolio']);
  }
  async submitQuery () {
    this.dataSource? this.dataSource.data = null : null;
    this.updatePortfolioData (undefined,this.clientId,this.strategyId,this.actionOnAccountTable,this.accessToClientData).then (rowsCount => this.CommonDialogsService.snackResultHandler({name:'success',detail: formatNumber (rowsCount,'en-US') + ' rows'},'Loaded '));
  }
  exportToExcel() {
    this.HandlingCommonTasksS.exportToExcel (this.dataSource.data,"PortfolioData")
  }
  showClientData(element:any) {
    this.expandAllowed? this.expandedElement = this.expandedElement === element ? null : element:this.expandAllowed=true;
  }
}