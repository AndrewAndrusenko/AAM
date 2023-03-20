import {AfterViewInit, Component, EventEmitter, Output, ViewChild} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {lastValueFrom, Subscription } from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {TreeMenuSevice } from 'src/app/services/tree-menu.service';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { SWIFTSGlobalListmodel } from 'src/app/models/accounts-table-model';
import { AppAccountingService } from 'src/app/services/app-accounting.service';
@Component({
  selector: 'app-table-swift-IN-list',
  templateUrl: './app-table-swift-IN-list.html',
  styleUrls: ['./app-table-swift-IN-list.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class AppTableSWIFTsInListsComponent  implements AfterViewInit {
  columnsToDisplay = ['msgId',  'senderBIC', 'DateMsg', 'typeMsg','accountNo', 'ledgerNo'];
  columnsHeaderToDisplay = ['msgId',  'senderBIC', 'Date', 'Type','Account','ledger'];
  columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
  dataSource: MatTableDataSource<SWIFTSGlobalListmodel>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @Output() public modal_principal_parent = new EventEmitter();
  expandedElement: SWIFTSGlobalListmodel  | null;
  accessToClientData: string = 'true';
  action ='';

  constructor(private AccountingDataService:AppAccountingService, private TreeMenuSevice:TreeMenuSevice, private dialog: MatDialog ) {}

  async ngAfterViewInit() {
    this.columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
    let userData = JSON.parse(localStorage.getItem('userInfo'))
    await lastValueFrom (this.TreeMenuSevice.getaccessRestriction (userData.user.accessrole, 'accessToClientData'))
    .then ((accessRestrictionData) =>{
      this.accessToClientData = accessRestrictionData['elementvalue']
      this.AccountingDataService.GetSWIFTsList (null,null,null,null,'GetSWIFTsList').subscribe (SWIFTsList  => {
        this.dataSource  = new MatTableDataSource(SWIFTsList);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      })
    })
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage();}
  }
  
/*   chooseStrategy (element) {
    console.log('chose account', element);
    this.currentStrategy = element;
    this.modal_principal_parent.emit('CLOSE_PARENT_MODAL');
  }
  openStrategyForm (actionType:string, row: any ) {
    console.log('row', row);
    this.dialogRef = this.dialog.open(AppStrategyFormComponent ,{minHeight:'400px', maxWidth:'1000px' });
    this.dialogRef.componentInstance.action = actionType;
    this.dialogRef.componentInstance.title = actionType;
    this.dialogRef.componentInstance.data = row;
    switch (actionType) {
      case 'Create':
      case 'Create_Example': 
      this.dialogRef.componentInstance.title = 'Create New';
      break;
    }
  } */
}