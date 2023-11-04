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
import { Router } from '@angular/router';
import { TreeMenuSevice } from 'src/app/services/tree-menu.service';
import { routesTreeMenu } from 'src/app/app-routing.module';
import { Subscription } from 'rxjs';
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
  expandedElement: AccountsTableModel  | null;
  columnsToDisplay : string[] = ['idportfolio', 'portfolioname','stategy_name', 'description', 'action'];
  columnsToHeaderDisplay : string[] = ['ID', 'Code','Stategy', 'Stategy Title', 'Action'];
  columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  readOnly: boolean = true;
  dialogRef: MatDialogRef<AppNewAccountComponent>;
  @Input() clientId: number;
  @Input() strategyMpName: string;
  @Input() actionOnAccountTable: string;
  @Input() action: string;
  @Input() row: any;
  @Output() public modal_principal_parent = new EventEmitter();
  expandAllowed: boolean = false;
  routesPathsTreeMenu = routesTreeMenu.map (el=>el.path);
  arraySubscrition = new Subscription()
  constructor(
    private dialog: MatDialog,
    private TreeMenuSeviceS:TreeMenuSevice, 
    private router: Router,
    private InvestmentDataService:AppInvestmentDataServiceService, 
    private AuthServiceS:AuthService,  
    private CommonDialogsService:HadlingCommonDialogsService,
    private HandlingCommonTasksS:HandlingCommonTasksService
  )   { }
  updatePortfolioData (portfolioid: number, clientid:number, strategyMpName:string, action: string, accessToClientData:string,snack:boolean=true ) {
    this.dataSource? this.dataSource.data=null : null;
    this.InvestmentDataService.getPortfoliosData('', portfolioid,clientid,strategyMpName,action,accessToClientData).subscribe (portfoliosData=>{
      this.dataSource  = new MatTableDataSource(portfoliosData);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      snack? this.CommonDialogsService.snackResultHandler(Object.hasOwn(portfoliosData,'name')? portfoliosData : {name:'success', detail: portfoliosData.length},'Loaded '):null;
      ['Get_Portfolios_By_CientId','Get_Portfolios_By_StrategyId'].includes(action)? this.InvestmentDataService.sendClientsPortfolios(portfoliosData.map(el=> {return {id:el.idportfolio,code:el.portfolioname}})):null;
    })
  }
  ngOnInit(): void {
    this.accessToClientData = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToClientData')[0].elementvalue;
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToPortfolioData')[0].elementvalue;
    this.disabledControlElements = this.accessState === 'full'? false : true;
    console.log('strategyMpName',this.strategyMpName);
    this.updatePortfolioData (undefined, this.clientId,this.strategyMpName,this.actionOnAccountTable,this.accessToClientData,false);
    this.arraySubscrition.add (
      this.InvestmentDataService.getReloadPortfoliosData().subscribe(data => this.updatePortfolioData (undefined, this.clientId,this.strategyMpName,this.actionOnAccountTable,this.accessToClientData))
    )
  }
  ngOnDestroy(): void {
    this.arraySubscrition.unsubscribe();
  }
  ngOnChanges(changes: SimpleChanges) {
    console.log('this.clientId,',this.clientId,this.actionOnAccountTable);
    this.updatePortfolioData (undefined, this.clientId,this.strategyMpName,this.actionOnAccountTable,this.accessToClientData,false);
  }
  chooseAccount (element) {
    this.modal_principal_parent.emit(element);
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage();}
  }
  navigateToAccountForm (actionType:string, row: AccountsTableModel ) {
    this.routesPathsTreeMenu.includes('Portfolios')? this.router.navigate(['tree/'+'Portfolios']) : this.router.navigate(['tree/']);
    this.TreeMenuSeviceS.sendUpdate('Portfolios', row.portfolioname, +row.idportfolio,'View')
    this.expandAllowed = false;
  }
  openAccountForm (actionType:string, row: any ) {
    this.expandAllowed = false;
    this.dialogRef = this.dialog.open(AppNewAccountComponent ,{minHeight:'400px', maxWidth:'1000px' });
    this.dialogRef.componentInstance.action = actionType;
    this.dialogRef.componentInstance.portfolioCode = Number(row['idportfolio']);
  }
  async submitQuery () {
    this.dataSource? this.dataSource.data = null : null;
    this.updatePortfolioData (undefined,this.clientId,this.strategyMpName,this.actionOnAccountTable,this.accessToClientData);
  }
  exportToExcel() {
    this.HandlingCommonTasksS.exportToExcel (this.dataSource.data,"PortfolioData")
  }
  showClientData(element:any) {
    this.expandAllowed? this.expandedElement = this.expandedElement === element ? null : element:this.expandAllowed=true;
  }
}