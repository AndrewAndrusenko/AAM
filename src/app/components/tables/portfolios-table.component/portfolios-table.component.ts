import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {AccountsTableModel } from 'src/app/models/interfaces.model';
import {MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import {AppNewAccountComponent } from '../../forms/portfolio-form.component/portfolio-form.component';
import {AppInvestmentDataServiceService } from 'src/app/services/investment-data.service.service';
import {AuthService } from 'src/app/services/auth.service';
import { HandlingCommonTasksService } from 'src/app/services/handling-common-tasks.service';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { Router } from '@angular/router';
import { TreeMenuSevice } from 'src/app/services/tree-menu.service';
import { routesTreeMenu } from 'src/app/app-routing.module';
import { Subscription } from 'rxjs';
import { AppFeesHandlingService } from 'src/app/services/fees-handling.service';
@Component({
  selector: 'app-portfolio-tablee',
  templateUrl: './portfolios-table.component.html',
  styleUrls: ['./portfolios-table.component.scss'],
  animations: [
    trigger('detailExpand',
    [   state('collapsed, void', style({ height: '0px'})),
        state('expanded', style({ height: '*' })),
        transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        transition('expanded <=> void', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ])
  ],
})
export class TablePortfolios {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  accessToClientData: string = 'none';
  dataSource: MatTableDataSource<AccountsTableModel>;
  expandedElement: AccountsTableModel;
  columnsToDisplay : string[] = ['idportfolio', 'portfolioname','stategy_name', 'description', 'action'];
  columnsToHeaderDisplay : string[] = ['ID', 'Code','Stategy', 'Stategy Title', 'Action'];
  columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  dialogRef: MatDialogRef<AppNewAccountComponent>;
  @Input() sendClientsPortfolio: boolean=true;
  @Input() readOnly: boolean=false;
  @Input() clientId: number;
  @Input() strategyMpName: string;
  @Input() idFeeMain: number;
  @Input() actionOnAccountTable: string;
  @Input() action: string;
  @Input() row: AccountsTableModel;
  @Output() public modal_principal_parent = new EventEmitter();
  expandAllowed: boolean = true;
  routesPathsTreeMenu = routesTreeMenu.map (el=>el.path);
  arraySubscrition = new Subscription()
  constructor(
    private dialog: MatDialog,
    private TreeMenuSeviceS:TreeMenuSevice, 
    private router: Router,
    private InvestmentDataService:AppInvestmentDataServiceService, 
    private AuthServiceS:AuthService,  
    private CommonDialogsService:HadlingCommonDialogsService,
    private HandlingCommonTasksS:HandlingCommonTasksService,
    private AppFeesHandlingService:AppFeesHandlingService,
  )   { }
  updatePortfolioData (portfolioid: number, clientid:number, strategyMpName:string, action: string, accessToClientData:string,snack:boolean=false ) {
    this.dataSource? this.dataSource.data=null : null;
    this.InvestmentDataService.getPortfoliosData('', portfolioid,clientid,strategyMpName,action,this.idFeeMain, accessToClientData).subscribe (portfoliosData=>{
      this.dataSource  = new MatTableDataSource(portfoliosData);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      snack? this.CommonDialogsService.snackResultHandler(Object.hasOwn(portfoliosData,'name')? portfoliosData : {name:'success', detail: portfoliosData.length.toString()},'Loaded '):null;
      if (['Get_Portfolios_By_CientId','Get_Portfolios_By_StrategyId'].includes(action)&&this.sendClientsPortfolio) {
        this.InvestmentDataService.sendClientsPortfolios(portfoliosData.map(el=> {return {id:el.idportfolio,code:el.portfolioname}}))
      }
    })
  }
  ngOnInit(): void {
    this.accessToClientData = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToClientData')[0].elementvalue;
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToPortfolioData')[0].elementvalue;
    this.disabledControlElements = this.accessState === 'full'&&!this.readOnly? false : true;
    if (!['Get_Portfolios_By_CientId','Get_Portfolios_By_StrategyId'].includes(this.actionOnAccountTable)||this.action==='Select') 
      {this.updatePortfolioData (undefined, this.clientId,this.strategyMpName,this.actionOnAccountTable,this.accessToClientData,false)
    };
    this.arraySubscrition.add (
      this.InvestmentDataService.getReloadPortfoliosData().subscribe(() => this.updatePortfolioData (undefined, this.clientId,this.strategyMpName,this.actionOnAccountTable,this.accessToClientData))
    )
  }
  ngOnDestroy(): void {
    this.arraySubscrition.unsubscribe();
  }
  ngOnChanges() {
    this.updatePortfolioData (undefined, this.clientId,this.strategyMpName,this.actionOnAccountTable,this.accessToClientData,false);
  }
  chooseAccount (element:AccountsTableModel) {
    this.modal_principal_parent.emit(element);
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage();}
  }
  navigateToAccountForm (actionType:string, row: AccountsTableModel ) {
    this.routesPathsTreeMenu.includes('Portfolios')? this.router.navigate(['tree/'+'Portfolios']) : this.router.navigate(['tree/']);
    this.TreeMenuSeviceS.sendUpdate('Portfolios', row.portfolioname, +row.idportfolio,actionType)
    this.expandAllowed = false;
  }
  openAccountForm (actionType:string, row: AccountsTableModel ) {
    this.expandAllowed = false;
    this.dialogRef = this.dialog.open(AppNewAccountComponent ,{minHeight:'50vh', minWidth:'60vw' });
    this.dialogRef.componentInstance.action = actionType;
    this.dialogRef.componentInstance.portfolioCode = Number(row['idportfolio']);
  }
  submitQuery () {
    this.dataSource? this.dataSource.data = null : null;
    this.updatePortfolioData (undefined,this.clientId,this.strategyMpName,this.actionOnAccountTable,this.accessToClientData,true);
  }
  exportToExcel() {
    this.HandlingCommonTasksS.exportToExcel (this.dataSource.data,"PortfolioData")
  }
  showClientData(element:AccountsTableModel) {
    if (this.expandAllowed) {
      this.expandedElement = this.expandedElement === element ? null : element;
      this.AppFeesHandlingService.sendFeesPortfoliosWithSchedulesIsOpened(element.idportfolio,false)
    }
    else {this.expandAllowed=true}
  }
}