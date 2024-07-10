import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef} from '@angular/material/dialog';
import { AppClientFormComponent } from '../../forms/client-form.component/client-form.component';
import { AppNewAccountComponent } from '../../forms/portfolio-form.component/portfolio-form.component';
import { MatTableDataSource } from '@angular/material/table';
import { ClientData } from 'FrontendAngularSrc/app/models/interfaces.model';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { AppInvestmentDataServiceService } from 'FrontendAngularSrc/app/services/investment-data.service.service';
import { AuthService } from 'FrontendAngularSrc/app/services/auth.service';
import { HadlingCommonDialogsService } from 'FrontendAngularSrc/app/services/hadling-common-dialogs.service';
import { HandlingCommonTasksService } from 'FrontendAngularSrc/app/services/handling-common-tasks.service';
import { formatNumber } from '@angular/common';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { investmentNodeColor } from 'FrontendAngularSrc/app/models/constants.model';
import { TreeMenuSevice } from 'FrontendAngularSrc/app/services/tree-menu.service';
import { Router } from '@angular/router';
import { routesTreeMenu } from 'FrontendAngularSrc/app/app-routing.module';
@Component({
  selector: 'app-app-clients-table',
  templateUrl: './clients-table.component.html',
  styleUrls: ['./clients-table.component.scss'],
  animations: [
    trigger('detailExpand',
    [   state('collapsed, void', style({ height: '0px'})),
        state('expanded', style({ height: '*' })),
        transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        transition('expanded <=> void', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ])
  ],
})
export class AppClientsTableComponent  {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  accessToPortfolioData: string = 'none';
  dataSource: MatTableDataSource<ClientData>;
  expandedElement: ClientData  | null;
  expandAllowed: boolean = true;
  columnsToDisplay : string[] = ['idclient','clientname','idcountrydomicile', 'isclientproffesional', 'address','contact_person','email','phone', 'action'  ];
  columnsToHeaderDisplay : string[] = ['ID','Title','Country', 'Pro', 'Address','Contact','Email','Phone','Action'  ];
  columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  dialogRef: MatDialogRef<AppClientFormComponent>;
  dialogAccountRef: MatDialogRef<AppNewAccountComponent>
  dialogNewAccountRef: MatDialogRef<AppNewAccountComponent>;
  @Output() public modal_principal_parent = new EventEmitter();
  action ='';
  investmentNodeColor=investmentNodeColor
  routesPathsTreeMenu = routesTreeMenu.map (el=>el.path)

  constructor(
    private dialog: MatDialog,  
    private TreeMenuSeviceS:TreeMenuSevice, 
    private router: Router,  
    private InvestmentDataService:AppInvestmentDataServiceService, 
    private AuthServiceS:AuthService,  
    private CommonDialogsService:HadlingCommonDialogsService,
    private HandlingCommonTasksS:HandlingCommonTasksService,
  ) 
  { 
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToClientData')[0].elementvalue;
    this.accessToPortfolioData = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToPortfolioData')[0].elementvalue;
    this.disabledControlElements = this.accessState === 'full'? false : true;
    this.updateClientData(null,null,null);
    this.InvestmentDataService.getReloadClientTable().subscribe(data => this.updateClientData (null, null, null));
  }
  updateClientData (client: number, clientname: string, action: string,snack:boolean=false) {
    if (this.accessState !=='none') {
      this.dataSource? this.dataSource.data=null : null;
      this.InvestmentDataService.getClientData(client,clientname,action).subscribe (data => {
        snack? this.CommonDialogsService.snackResultHandler({name:'success',detail: formatNumber (data.length,'en-US') + ' rows'},'Loaded '):null;
        this.dataSource  = new MatTableDataSource(data);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      })
    } 
  }
  chooseClient (element:ClientData) {
    this.modal_principal_parent.emit(element);
  }
  navigateToClientModifyForm (actionType: string, element:ClientData) {
    this.router.navigate(['tree/']);
    this.TreeMenuSeviceS.sendUpdate('Clients', element.clientname, element.idclient,'Edit')
    this.expandAllowed = false;
  }
  openClientModifyForm (actionType: string, element:ClientData) {
    this.expandAllowed = false;
    this.dialogRef = this.dialog.open(AppClientFormComponent ,{minHeight:'50vh', minWidth:'50vw' });
    this.dialogRef.componentInstance.client = element === null? 0 : element.idclient;
    this.dialogRef.componentInstance.action = actionType;
  }
  openNewPortfolioForm (element:ClientData) {
    this.expandAllowed = false;
    this.dialogNewAccountRef = this.dialog.open(AppNewAccountComponent ,{minHeight:'50vh', minWidth:'60vw' });
    this.dialogNewAccountRef.componentInstance.portfolioForm.controls['idclient'].patchValue(element.idclient)
    this.dialogNewAccountRef.componentInstance.portfolioForm.controls['clientname'].patchValue(element.clientname)
    this.dialogNewAccountRef.componentInstance.action = 'Create';
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage();}
  }
  exportToExcel() {
    this.HandlingCommonTasksS.exportToExcel (this.dataSource.data,"ClientData")
  }
  showPortfolios($event:Event,element:ClientData) {
    this.expandAllowed? this.expandedElement = this.expandedElement === element ? null : element:this.expandAllowed=true;
  }
}