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
  dialogRef: MatDialogRef<TableAccounts>;
  public title: string;
  public actionType : string;
  public actionToConfim = {'action':'delete_client' ,'isConfirmed': false}
  public AppSnackMsgbox : AppSnackMsgboxComponent
  public data: any;
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
   /*  case 'Delete': 
      this.entryModifyForm.patchValue(this.data);
    break;
    default :
      this.title = "Edit"
      this.entryModifyForm.patchValue(this.data);
      this.dataTime.setValue(new Date(this.data.dataTime).toISOString())
    break;  */
   }  
   this.title = this.action;
   this.entryModifyForm.patchValue(this.data);
   this.dataTime.setValue(new Date(this.data.t_dataTime).toISOString());
   this.xActTypeCode.setValue(Number(this.data.t_XactTypeCode));
   this.xActTypeCode_Ext.setValue(Number(this.data.t_XactTypeCode_Ext));

  }

  ngAfterViewInit(): void {
    this.GamountTransaction.updateValueAndValidity()
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
​
  get  Debit ()   {return this.entryModifyForm.get('d_Debit') } 
  get  id ()   {return this.entryModifyForm.get('t_id') } 
  get  Credit ()   {return this.entryModifyForm.get('d_Credit') } 
  get  dataTime ()   {return this.entryModifyForm.get('t_dataTime') } 
  get  entryDetails ()   {return this.entryModifyForm.get('d_entryDetails') } 
  public get  GamountTransaction ()   {return this.entryModifyForm.get('t_amountTransaction') } 
  get  xActTypeCode_Ext ()   {return this.entryModifyForm.get('t_XactTypeCode_Ext') } 
  get  xActTypeCode ()   {return this.entryModifyForm.get('t_XactTypeCode') } 

}