import { AfterViewInit, Component,  Input, OnInit, SimpleChanges,  } from '@angular/core';
import { FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AppConfimActionComponent } from '../../alerts/app-confim-action/app-confim-action.component';
import { AppSnackMsgboxComponent } from '../../app-snack-msgbox/app-snack-msgbox.component';
import { MatSnackBar} from '@angular/material/snack-bar';
import { AppInvestmentDataServiceService } from 'src/app/services/app-investment-data.service.service';
import { TableAccounts } from '../../tables/app-table-accout/app-table-accout.component';
import { customAsyncValidators } from 'src/app/services/customAsyncValidators';
import { AppAccountingService } from 'src/app/services/app-accounting.service';
import { bAccountsEntriesList, bcTransactionType_Ext } from 'src/app/models/accounts-table-model';
import { AppTableAccLedgerAccountsComponent } from '../../tables/app-table-acc-ledger-accounts/app-table-acc-ledger-accounts';
import { AppTableAccAccountsComponent } from '../../tables/app-table-acc-accounts/app-table-acc-accounts';
interface Level {
  value: number;
  viewValue: string;
}
@Component({
  selector: 'app-acc-entry-modify-form',
  templateUrl: './app-acc-entry-modify-form.html',
  styleUrls: ['./app-acc-entry-modify-form.scss'],
})
export class AppAccEntryModifyFormComponent implements OnInit, AfterViewInit {

  public panelOpenState = true;
  public entryModifyForm: FormGroup;
  @Input() action: string;
  dialogRefConfirm: MatDialogRef<AppConfimActionComponent>;
  dialogChoseAccount: MatDialogRef<AppTableAccAccountsComponent>;
  dialogChoseLedger: MatDialogRef<AppTableAccLedgerAccountsComponent>;
  public title: string;
  public actionType : string;
  public actionToConfim = {'action':'delete_client' ,'isConfirmed': false}
  public AppSnackMsgbox : AppSnackMsgboxComponent
  public data: any;
  public Closed : Date
  TransactionTypes: bcTransactionType_Ext[] = [];

  constructor (
    private fb:FormBuilder, 
    private InvestmentDataServiceService:AppInvestmentDataServiceService, 
    private AccountingDataService:AppAccountingService, 
    private dialog: MatDialog, 
    public snack:MatSnackBar
  ) 
  { this.AccountingDataService.GetTransactionType_Ext('',0,'','','bcTransactionType_Ext').subscribe (
    data => this.TransactionTypes=data)
   
    this.entryModifyForm = this.fb.group ({
      t_id: {value:null, disabled: false},
      t_entryDetails:{value:null, disabled: false},
      t_ledgerNoId: {value:null, disabled: false}, 
      t_accountId: {value:null, disabled: false}, 
      t_extTransactionId : {value:null, disabled: false}, 
      t_dataTime: {value:null, disabled: false}, 
      t_amountTransaction: {value:null, disabled: false}, 
      t_XactTypeCode: {value:null, disabled: false},  
      t_XactTypeCode_Ext: {value:null, disabled: false}, 
      d_Debit : {value:null, disabled: false},  
      d_Credit : {value:null, disabled: false},  
      d_ledgerNo: {value:null, disabled: false}, 
      d_accountNo: {value:null, disabled: false},  
      d_xActTypeCode_ExtName : {value:null, disabled: false}, 
      d_entryDetails: {value:null, disabled: false}, 
    })
  }

  ngOnInit(): void {
    this.panelOpenState = true;
    switch (this.action) {
      case 'Create': 
      break;
      case 'Create_Example':
        this.data['id']=null;
        this.entryModifyForm.patchValue(this.data);
      break;
    }  
    this.title = this.action;
    this.entryModifyForm.patchValue(this.data);
    this.dataTime.setValue(new Date(this.data.t_dataTime).toISOString());
    this.xActTypeCode.setValue(Number(this.data.t_XactTypeCode));
    this.xActTypeCode_Ext.setValue(Number(this.data.t_XactTypeCode_Ext));
  }

  ngAfterViewInit(): void {
  }
  ClsAcc (){
    this.AccountingDataService.GetbLastClosedAccountingDate(null,null,null,null,'GetbLastClosedAccountingDate').subscribe(data => this.Closed = data[0].ClosedDate)
  }
  selectAccount () {
    this.dialogChoseAccount = this.dialog.open(AppTableAccAccountsComponent ,{minHeight:'600px', minWidth:'1300px', autoFocus: false, maxHeight: '90vh'});
    this.dialogChoseAccount.componentInstance.action = "Select";
    this.dialogChoseAccount.componentInstance.readOnly = true;
    this.dialogChoseAccount.componentInstance.modal_principal_parent.subscribe ((item)=>{
      this.entryModifyForm.controls['t_accountId'].patchValue(this.dialogChoseAccount.componentInstance.selectedRow['accountId'])
      this.entryModifyForm.controls['d_accountNo'].patchValue(this.dialogChoseAccount.componentInstance.selectedRow['accountNo'])
      this.entryModifyForm.controls['d_accountNo'].patchValue(this.dialogChoseAccount.componentInstance.selectedRow['accountNo'])
      this.dialogChoseAccount.close(); 
    });
  }
  selectLedger () {
    this.dialogChoseLedger = this.dialog.open(AppTableAccLedgerAccountsComponent ,{minHeight:'600px', minWidth:'1300px', autoFocus: false, maxHeight: '90vh'});
    this.dialogChoseLedger.componentInstance.action = "Select";
    this.dialogChoseLedger.componentInstance.readOnly = true;
    this.dialogChoseLedger.componentInstance.modal_principal_parent.subscribe ((item)=>{
      this.entryModifyForm.controls['t_ledgerNoId'].patchValue(this.dialogChoseLedger.componentInstance.selectedRow['ledgerNoId'])
      this.entryModifyForm.controls['d_ledgerNo'].patchValue(this.dialogChoseLedger.componentInstance.selectedRow['ledgerNo'])
      this.entryModifyForm.controls['d_ledgerNo'].patchValue(this.dialogChoseLedger.componentInstance.selectedRow['ledgerNo'])
      this.dialogChoseLedger.close(); 
    });
  }
  updateStrategyData(action:string){
    console.log('action',action);
    switch (action) {
      case 'Create_Example':
      case 'Create':
        this.entryModifyForm.controls['s_benchmark_account'].enable()
        this.InvestmentDataServiceService.createStrategy (this.entryModifyForm.value).then ( (result) => {
          if (result['name']=='error') {
            this.snack.open('Error: ' + result['detail'].split("\n", 1).join(""),'OK',{panelClass: ['snackbar-error']}); 
          } else {
            this.snack.open('Created: ' + result + ' strategy','OK',{panelClass: ['snackbar-success'], duration: 3000});
            this.InvestmentDataServiceService.sendReloadStrategyList (this.entryModifyForm.controls['id']);
          }
        })
        this.entryModifyForm.controls['id'].disable()
        this.entryModifyForm.controls['s_benchmark_account'].enable()
      break;

      case 'Edit':
        this.entryModifyForm.controls['s_benchmark_account'].enable()
        this.entryModifyForm.controls['id'].enable()
        this.InvestmentDataServiceService.updateStrategy (this.entryModifyForm.value).then ( (result) => {
          if (result['name']=='error') {
            this.snack.open('Error: ' + result['detail'].split("\n", 1).join(""),'OK',{panelClass: ['snackbar-error']} ) 
          } else {
            this.snack.open('Updated: ' + result + ' strategy','OK',{panelClass: ['snackbar-success'], duration: 3000})
            this.InvestmentDataServiceService.sendReloadStrategyList (this.entryModifyForm.controls['id']);
          }
        })
        this.entryModifyForm.controls['s_benchmark_account'].disable()
        this.entryModifyForm.controls['id'].disable()
      break;

      case 'Delete':
        this.dialogRefConfirm = this.dialog.open(AppConfimActionComponent, {panelClass: 'custom-modalbox',} );
        this.dialogRefConfirm.componentInstance.actionToConfim = {'action':'Delete Strategy' ,'isConfirmed': false}
        this.dialogRefConfirm.afterClosed().subscribe (actionToConfim => {
          console.log('action', actionToConfim)
          if (actionToConfim.isConfirmed===true) {
          this.entryModifyForm.controls['id'].enable()
          this.InvestmentDataServiceService.deleteStrategy (this.entryModifyForm.value['id']).then ((result) =>{
            if (result['name']=='error') {
              this.snack.open('Error: ' + result['detail'],'OK',{panelClass: ['snackbar-error']} ) 
            } else {
              this.snack.open('Deleted: ' + result + ' strategy','OK',{panelClass: ['snackbar-success'], duration: 3000})
              this.InvestmentDataServiceService.sendReloadStrategyList (this.entryModifyForm.controls['id']);
              this.dialog.closeAll();
            }
          })
          this.entryModifyForm.controls['id'].disable()
         
          }
        })
      break;
    }
  }
/* 
  selectBenchmarkAccount () {
    this.dialogRef = this.dialog.open(TableAccounts ,{minHeight:'400px', minWidth:'900px', autoFocus: false, maxHeight: '90vh'});
    this.dialogRef.componentInstance.action = 'Select_Benchmark';
    this.dialogRef.componentInstance.modal_principal_parent.subscribe ((item)=>{
      this.data = this.dialogRef.componentInstance.currentAccout;
      console.log('close',this.data);
      console.log('id comp',this.id.value,this.dialogRef.componentInstance.currentAccout['idstategy']);
      
      if (this.id.value !== this.dialogRef.componentInstance.currentAccout['idstategy']) {
        this.dialogRefConfirm = this.dialog.open(AppConfimActionComponent, {panelClass: 'custom-modalbox',} );
        this.dialogRefConfirm.componentInstance.actionToConfim = {'action':'Select account with different strategy' ,'isConfirmed': false}
        this.dialogRefConfirm.afterClosed().subscribe (actionToConfim => {
          console.log('action', actionToConfim)
          if (actionToConfim.isConfirmed===true) {
            this.dialogRef.close(); 
            this.entryModifyForm.controls['s_benchmark_account'].patchValue(this.data['idportfolio'])
            this.entryModifyForm.controls['Benchmark Account'].patchValue(this.data['portfolioname'])
          }
        })
      } else {
      this.entryModifyForm.controls['s_benchmark_account'].patchValue(this.data['idportfolio'])
      this.entryModifyForm.controls['Benchmark Account'].patchValue(this.data['portfolioname'])
      }
      this.dialogRef.close(); 
    });
    console.log('action',this.actionType);
    switch (this.actionType) {
      case 'Create':
      case 'Create_Example': 
      break;
  }
  }
 */​
  get  Debit ()   {return this.entryModifyForm.get('d_Debit') } 
  get  Credit ()   {return this.entryModifyForm.get('d_Credit') } 
  get  id ()   {return this.entryModifyForm.get('t_id') } 
  get  dataTime ()   {return this.entryModifyForm.get('t_dataTime') } 
  get  entryDetails ()   {return this.entryModifyForm.get('d_entryDetails') } 
  public get  GamountTransaction ()   {return this.entryModifyForm.get('t_amountTransaction') } 
  public get  xActTypeCode_Ext ()   {return this.entryModifyForm.get('t_XactTypeCode_Ext') } 
  get  xActTypeCode ()   {return this.entryModifyForm.get('t_XactTypeCode') } 

}