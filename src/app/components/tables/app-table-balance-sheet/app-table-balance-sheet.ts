import {AfterViewInit, Component, EventEmitter, Output, ViewChild} from '@angular/core';
import {MatPaginator as MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {lastValueFrom, Subscription } from 'rxjs';
import {MatTableDataSource as MatTableDataSource} from '@angular/material/table';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {TreeMenuSevice } from 'src/app/services/tree-menu.service';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { bAccountsEntriesList } from 'src/app/models/accounts-table-model';
import { AppAccountingService } from 'src/app/services/app-accounting.service';
import { AppAccEntryModifyFormComponent } from '../../forms/app-acc-entry-modify-form/app-acc-entry-modify-form';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {MatChipInputEvent} from '@angular/material/chips';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
export interface Fruit {
  name: string;
}
@Component({
  selector: 'app-table-balance-sheet',
  templateUrl: './app-table-balance-sheet.html',
  styleUrls: ['./app-table-balance-sheet.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class AppTableBalanceSheetComponent  implements AfterViewInit {
  columnsToDisplay = [
    'd_Debit',
    'd_Credit',
    't_dataTime', 
    't_XactTypeCode',  
    'd_xActTypeCodeExtName', 
    't_amountTransaction', 
    'd_entryDetails', 
  ]
  columnsHeaderToDisplay = [
    'debit',
    'credit',
    'dataTime', 
    'Ledger',  
    'Code', 
    'amount', 
    'Details', 
  ];
  columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
  dataSource: MatTableDataSource<bAccountsEntriesList>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @Output() public modal_principal_parent = new EventEmitter();
  expandedElement: bAccountsEntriesList  | null;
  accessToClientData: string = 'true';
  public readOnly: boolean = false; 
  action ='';
  dialogRef: MatDialogRef<AppAccEntryModifyFormComponent>;
  private subscriptionName: Subscription;
  public FirstOpenedAccountingDate : Date;
 
  filterlFormControl = new FormControl('');
  
  addOnBlur = true;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  fruits: Fruit[] = [{name: 'AccountNo'}];
  range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });
  
  panelOpenState = false;
  public searchParameters: FormGroup;
  
  constructor(
    private AccountingDataService:AppAccountingService, 
    private TreeMenuSevice:TreeMenuSevice, 
    private dialog: MatDialog,
    private fb:FormBuilder 

  ) {
    this.AccountingDataService.GetbLastClosedAccountingDate(null,null,null,null,'GetbLastClosedAccountingDate').subscribe(data => this.FirstOpenedAccountingDate = data[0].FirstOpenedDate)
    this.subscriptionName= this.AccountingDataService.getReloadAccontList().subscribe ( (id) => {
      this.AccountingDataService.GetAccountsEntriesListAccounting (null,null,null,null,'GetAccountsEntriesListAccounting').subscribe (EntriesList  => {
        this.dataSource  = new MatTableDataSource(EntriesList);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      })
    } )
    this.searchParameters = this.fb.group ({
      d_transactionType: {value:null, disabled: false},
      t_id: {value:0, disabled: false},
      t_accountId: {value:null, disabled: false}, 
      t_ledgerNoId: {value:null, disabled: false}, 
      t_extTransactionId : {value:null, disabled: false}, 
      t_dataTime: [null, [Validators.required]],  
      t_amountTransaction: [0, [Validators.required, Validators.pattern('[0-9.,]*') ]   ], 
      t_XactTypeCode: {value:null, disabled: false},  
      t_XactTypeCode_Ext: [null, [Validators.required]], 
      d_Debit : {value:null, disabled: false},  
      d_Credit : {value:null, disabled: false},  

    })
  }

  async ngAfterViewInit() {
    this.columnsToDisplayWithExpand = [...this.columnsToDisplay ,'expand'];
    let userData = JSON.parse(localStorage.getItem('userInfo'))
    await lastValueFrom (this.TreeMenuSevice.getaccessRestriction (userData.user.accessrole, 'accessToClientData'))
    .then ((accessRestrictionData) =>{
      this.accessToClientData = accessRestrictionData['elementvalue']
      this.AccountingDataService.GetAccountsEntriesListAccounting (null,null,null,null,'GetAccountsEntriesListAccounting').subscribe (EntriesList  => {
        this.dataSource  = new MatTableDataSource(EntriesList);
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
  openEntryModifyForm (actionType:string, row: any ) {
    console.log('row', row);
    this.dialogRef = this.dialog.open(AppAccEntryModifyFormComponent ,{minHeight:'400px', maxWidth:'1000px' });
    this.dialogRef.componentInstance.action = actionType;
    this.dialogRef.componentInstance.title = actionType;
    this.dialogRef.componentInstance.data = row;
    this.dialogRef.componentInstance.FirstOpenedAccountingDate = this.FirstOpenedAccountingDate;

    switch (actionType) {
      case 'Create':
      case 'Create_Example': 
      this.dialogRef.componentInstance.title = 'Create New';
      break;
      case 'View':
        this.dialogRef.componentInstance.entryModifyForm.disable()
      break;
    }
  }
  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    // Add our fruit
    if (value) {
      this.fruits.push({name: value});
    }

    // Clear the input value
    event.chipInput!.clear();
  }

  remove(fruit: Fruit): void {
    const index = this.fruits.indexOf(fruit);

    if (index >= 0) {
      this.fruits.splice(index, 1);
    }
  }
  updateFilter (event:Event, el: any) {
    this.filterlFormControl.patchValue(el)
    console.log('filter',this.filterlFormControl.value);
    this.dataSource.filter = el.trim()
    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage();}
  }
  clearFilter () {
    this.filterlFormControl.patchValue('')
    this.dataSource.filter = ''

    if (this.dataSource.paginator) {this.dataSource.paginator.firstPage();}

  }
 
}