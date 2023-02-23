import {AfterViewInit, Component, EventEmitter, Input, Output, SimpleChanges, ViewChild} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {lastValueFrom, Subscription } from 'rxjs';
import {MatTableDataSource} from '@angular/material/table';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {TreeMenuSevice } from 'src/app/services/tree-menu.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SWIFTStatement950model } from 'src/app/models/accounts-table-model';
import { AppAccountingService } from 'src/app/services/app-accounting.service';
@Component({
  selector: 'app-table-swift-950-items-process',
  templateUrl: './app-table-swift-950-items-process.html',
  styleUrls: ['./app-table-swift-950-items-process.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class AppTableSWIFT950ItemsComponent  implements AfterViewInit {
  @Input() parentMsgId: number;
  columnsToDisplay = ['amountTransaction',  'typeTransaction', 'valueDate', 'comment' ];
  columnsHeaderToDisplay = ['amount',  'type', 'value', 'comment'];
  columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
  dataSource: MatTableDataSource<SWIFTStatement950model>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @Output() public modal_principal_parent = new EventEmitter();
  expandedElement: SWIFTStatement950model  | null;
  accessToClientData: string = 'true';
  action ='';

  constructor(private AccountingDataService:AppAccountingService, private TreeMenuSevice:TreeMenuSevice, private dialog: MatDialog ) {}

  async ngAfterViewInit() {
    this.columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
    let userData = JSON.parse(localStorage.getItem('userInfo'))
    await lastValueFrom (this.TreeMenuSevice.getaccessRestriction (userData.user.accessrole, 'accessToClientData'))
    .then ((accessRestrictionData) =>{
      this.accessToClientData = accessRestrictionData['elementvalue']
      this.AccountingDataService.GetMT950Transactions (null,this.parentMsgId,null,null,'GetMT950Transactions').subscribe (MT950Transactions  => {
        this.dataSource  = new MatTableDataSource(MT950Transactions);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      })
    })
  }
  
  ngOnChanges(changes: SimpleChanges) {

    console.log('changes', changes);
    let newId = changes['id'].currentValue
    console.log('OK', newId);

    this.AccountingDataService.GetMT950Transactions (null,newId,null,null,'GetMT950Transactions').subscribe (MT950Transactions  => {
      this.dataSource  = new MatTableDataSource(MT950Transactions);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
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