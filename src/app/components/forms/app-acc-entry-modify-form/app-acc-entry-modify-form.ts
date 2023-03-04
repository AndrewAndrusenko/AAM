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
  @Input()  client : number;
  @Input() action: string;
  dialogRefConfirm: MatDialogRef<AppConfimActionComponent>;
  isEditForm: boolean = false;
  dialogRef: MatDialogRef<TableAccounts>;
  dtOptions: any = {};
  public title: string;
  public actionType : string;
  public strategyId : any;
  public MP : boolean;
  public actionToConfim = {'action':'delete_client' ,'isConfirmed': false}
  public AppSnackMsgbox : AppSnackMsgboxComponent
  public showStrateryStructure: boolean;
  public data: any;
  constructor (
    private fb:FormBuilder, private InvestmentDataServiceService:AppInvestmentDataServiceService, AccountingDataService:AppAccountingService, private dialog: MatDialog, public snack:MatSnackBar
  ) {    this.entryModifyForm=this.fb.group ({
    Debit: {value:'', disabled: false},
    Credit: {value:'', disabled: false},
    dataTime: {value:'', disabled: false}, 
    XactTypeCode: {value:'', disabled: false},  
    xActTypeCode_Ext: {value:'', disabled: false}, 
    amountTransaction: {value:null, disabled: false}, 
    entryDetails : {value:'', disabled: false}, 

  })}
  ngAfterViewInit(): void {
    this.GamountTransaction.updateValueAndValidity()
  }
  ngOnInit(): void {
    this.panelOpenState = true;


   switch (this.action) {
    case 'Create': 
    break;
    case 'Create_Example':
      this.data['id']='';
      this.entryModifyForm.patchValue(this.data);
    break;
    case 'Delete': 
      this.entryModifyForm.patchValue(this.data);
    break;
    default :
      this.title = "Edit"
      this.entryModifyForm.patchValue(this.data);
      this.dataTime.setValue(new Date(this.data.dataTime).toISOString())
    break; 
   }  
/*     this.entryModifyForm.controls['name'].addValidators ( [Validators.required])
    this.entryModifyForm.controls['description'].addValidators ( [Validators.required])
    this.entryModifyForm.controls['level'].addValidators ( [Validators.required, Validators.pattern('[0-9]*')])
    this.entryModifyForm.controls['name'].setAsyncValidators (
      customAsyncValidators.strategyCodeCustomAsyncValidator(this.InvestmentDataServiceService, this.id.value), 
    )   */
    // this.entryModifyForm.controls['name'].updateValueAndValidity();
  }

  ngOnChanges(changes: SimpleChanges) {
/*     console.log('changes', changes);
    this.InvestmentDataServiceService.getGlobalStategiesList(changes['client'].currentValue, null, 'Get_Strategy_Data').subscribe(data => {
      this.entryModifyForm.patchValue(data[0])
      this.strategyId = this.entryModifyForm.controls['id'].value
      this.MP = (this.entryModifyForm.controls['level'].value == 1 ) ? true : false
      console.log('level', this.MP);
      console.log('strategyId',this.strategyId);
      this.showStrateryStructure = true;
      this.entryModifyForm.controls['name'].setAsyncValidators(
        customAsyncValidators.strategyCodeCustomAsyncValidator(this.InvestmentDataServiceService, this.id.value)
      ) 
    }) */
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
  get  Debit ()   {return this.entryModifyForm.get('Debit') } 
  get  id ()   {return this.entryModifyForm.get('id') } 

  get  Credit ()   {return this.entryModifyForm.get('Credit') } 
  get  dataTime ()   {return this.entryModifyForm.get('dataTime') } 
  get  entryDetails ()   {return this.entryModifyForm.get('entryDetails') } 
  public get  GamountTransaction ()   {return this.entryModifyForm.get('amountTransaction') } 
  get  xActTypeCode_Ext ()   {return this.entryModifyForm.get('xActTypeCode_Ext') } 

}