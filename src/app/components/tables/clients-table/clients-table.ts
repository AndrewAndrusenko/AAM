import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef} from '@angular/material/dialog';
import { AppClientFormComponent } from '../../forms/client-form/client-form';
import { AppNewAccountComponent } from '../../forms/portfolio-form/portfolio-form';
import { MatTableDataSource } from '@angular/material/table';
import { ClientData } from 'src/app/models/intefaces';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { AppInvestmentDataServiceService } from 'src/app/services/app-investment-data.service.service';
import { AuthService } from 'src/app/services/auth.service';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { HandlingCommonTasksService } from 'src/app/services/handling-common-tasks.service';
import { formatNumber } from '@angular/common';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { investmentNodeColor } from 'src/app/models/constants';
@Component({
  selector: 'app-app-clients-table',
  templateUrl: './clients-table.html',
  styleUrls: ['./clients-table.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
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
  @Output() public modal_principal_parent = new EventEmitter();
  action ='';
  public readOnly: boolean = false;
  public selectedRow: any;
  investmentNodeColor=investmentNodeColor
  constructor(
    private dialog: MatDialog,    
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
  async updateClientData (client: number, clientname: string, action: string) {
    return new Promise<number> (async (resolve) => {
      if (this.accessState !=='none') {
        this.dataSource? this.dataSource.data=null : null;
        this.InvestmentDataService.getClientData(client,clientname,action).subscribe (data => {
          this.dataSource  = new MatTableDataSource(data);
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
          resolve (data.length);
        })
      } 
    })
  }
  chooseClient () {
    let table =  $('#mytable')
    let data = table.DataTable().row({ selected: true }).data()
    this.selectedRow = data;
    this.modal_principal_parent.emit('CLOSE_PARENT_MODAL');
  }
  openAddFileDialog(actionType, element:ClientData) {
    this.expandAllowed = false;
    this.dialogRef = this.dialog.open(AppClientFormComponent ,{minHeight:'400px', width:'900px' });
    this.dialogRef.componentInstance.client = element.idclient;
    this.dialogRef.componentInstance.action = actionType;
    this.dialogRef.componentInstance.title = ['Create','Create_Example'].includes(actionType)? 'Create New': actionType;
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage();}
  }
  submitQuery () {
    this.updateClientData (null,null,null).then ((rowsCount) => {
      this.CommonDialogsService.snackResultHandler({name:'success',detail: formatNumber (rowsCount,'en-US') + ' rows'},'Loaded ')
    }) 
  }
  exportToExcel() {
    this.HandlingCommonTasksS.exportToExcel (this.dataSource.data,"ClientData")
  }
  showPortfolios($event:Event,element:ClientData) {
    this.expandAllowed? this.expandedElement = this.expandedElement === element ? null : element:this.expandAllowed=true;
  }
}