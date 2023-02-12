import { AfterViewInit, Component,  Input, OnInit, SimpleChanges,  } from '@angular/core';
import { FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AppConfimActionComponent } from '../../alerts/app-confim-action/app-confim-action.component';
import { AppSnackMsgboxComponent } from '../../app-snack-msgbox/app-snack-msgbox.component';
import { MatSnackBar} from '@angular/material/snack-bar';
import { StrategynameValidator } from 'src/app/services/UniqueClientName';
import { AppInvestmentDataServiceService } from 'src/app/services/app-investment-data.service.service';
import { TableAccounts } from '../../tables/app-table-accout/app-table-accout.component';
interface Level {
  value: number;
  viewValue: string;
}
@Component({
  selector: 'app-app-strategy-form',
  templateUrl: './app-strategy-form.component.html',
  styleUrls: ['./app-strategy-form.component.scss'],
})
export class AppStrategyFormComponent implements OnInit, AfterViewInit {
  levels: Level[] = [
    {value: 1, viewValue: 'Model Portfolio'},
    {value: 2, viewValue: 'Strategy (based on MP)'},
  ];
  public panelOpenState = true;
  public editStrategyForm: FormGroup;
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
    private fb:FormBuilder, private InvestmentDataServiceService:AppInvestmentDataServiceService, private dialog: MatDialog, public snack:MatSnackBar
  ) {}
  ngAfterViewInit(): void {

  }
 
  ngOnInit(): void {
  this.panelOpenState = true;

    this.editStrategyForm=this.fb.group ({
      id: {value:'', disabled: true }, 
      name :[null, { updateOn: 'blur'} ], 
      level : {value:'', disabled: false}, 
      description: {value:'', disabled: false}, 
      s_benchmark_account: {value:'', disabled: true},
      'Benchmark Account': {value:'', disabled: true},
    })
   switch (this.action) {
    case 'Create': 

    break;
    case 'Create_Example':
      this.data['id']='';
      this.editStrategyForm.patchValue(this.data);
      this.name.markAsTouched();
    break;
    case 'Delete': 
      this.editStrategyForm.patchValue(this.data);
    break;
    default :
      this.editStrategyForm.patchValue(this.data);
      this.title = "Edit"
      this.editStrategyForm.patchValue(this.data);
      
    break; 
   }  
   this.editStrategyForm.controls['name'].addValidators ( [Validators.required])
      this.editStrategyForm.controls['description'].addValidators ( [Validators.required])
      this.editStrategyForm.controls['level'].addValidators ( [Validators.required, Validators.pattern('[0-9]*')])
   this.editStrategyForm.controls['name'].setAsyncValidators (
    StrategynameValidator.createValidator(this.InvestmentDataServiceService, this.id.value), 
   ) 
   this.editStrategyForm.controls['name'].updateValueAndValidity();
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('changes', changes);
    this.InvestmentDataServiceService.getGlobalStategiesList(changes['client'].currentValue, null, 'Get_Strategy_Data').subscribe(data => {
      this.editStrategyForm.patchValue(data[0])
      this.strategyId = this.editStrategyForm.controls['id'].value
      this.MP = (this.editStrategyForm.controls['level'].value == 1 ) ? true : false
      console.log('strategyId',this.strategyId);
      this.showStrateryStructure = true;
      this.editStrategyForm.controls['name'].setAsyncValidators(
        StrategynameValidator.createValidator(this.InvestmentDataServiceService, this.id.value)
      ) 
     this.editStrategyForm.controls['name'].updateValueAndValidity();
    })
  }

  updateStrategyData(action:string){
    console.log('action',action);
    switch (action) {
      case 'Create_Example':
      case 'Create':
        this.editStrategyForm.controls['s_benchmark_account'].enable()
        this.InvestmentDataServiceService.createStrategy (this.editStrategyForm.value).then ( (result) => {
          if (result['name']=='error') {
            this.snack.open('Error: ' + result['detail'].split("\n", 1).join(""),'OK',{panelClass: ['snackbar-error']} ) 
          } else {
            this.snack.open('Created: ' + result + ' strategy','OK',{panelClass: ['snackbar-success'], duration: 3000})
          }
        })
        this.editStrategyForm.controls['id'].disable()
        this.editStrategyForm.controls['s_benchmark_account'].enable()
      break;

      case 'Edit':
        this.editStrategyForm.controls['s_benchmark_account'].enable()
        this.editStrategyForm.controls['id'].enable()
        this.InvestmentDataServiceService.updateStrategy (this.editStrategyForm.value).then ( (result) => {
          if (result['name']=='error') {
            this.snack.open('Error: ' + result['detail'].split("\n", 1).join(""),'OK',{panelClass: ['snackbar-error']} ) 
          } else {
            this.snack.open('Updated: ' + result + ' strategy','OK',{panelClass: ['snackbar-success'], duration: 3000})
            // $('#mytable').DataTable().ajax.reload();
          }
        })
        this.editStrategyForm.controls['s_benchmark_account'].disable()
        this.editStrategyForm.controls['id'].disable()
      break;

      case 'Delete':
        this.dialogRefConfirm = this.dialog.open(AppConfimActionComponent, {panelClass: 'custom-modalbox',} );
        this.dialogRefConfirm.componentInstance.actionToConfim = {'action':'Delete Strategy' ,'isConfirmed': false}
        this.dialogRefConfirm.afterClosed().subscribe (actionToConfim => {
          console.log('action', actionToConfim)
          if (actionToConfim.isConfirmed===true) {
          this.editStrategyForm.controls['id'].enable()
          this.InvestmentDataServiceService.deleteStrategy (this.editStrategyForm.value['id']).then ((result) =>{
            if (result['name']=='error') {
              this.snack.open('Error: ' + result['detail'],'OK',{panelClass: ['snackbar-error']} ) 
            } else {
              this.snack.open('Deleted: ' + result + ' strategy','OK',{panelClass: ['snackbar-success'], duration: 3000})
              this.dialog.closeAll();
            }
          })
          this.editStrategyForm.controls['id'].disable()
         
          }
        })
      break;
    }
  }

  selectBenchmarkAccount () {
    this.dialogRef = this.dialog.open(TableAccounts ,{minHeight:'400px', minWidth:'900px' });
    this.dialogRef.componentInstance.modal_principal_parent.subscribe ((item)=>{
      this.dialogRef.componentInstance.expandedElement
      console.log('close',item, this.dialogRef.componentInstance.currentAccout);
      console.log(this.dialogRef.componentInstance.currentAccout['account_id'],this.editStrategyForm.controls['s_benchmark_account']);
      this.editStrategyForm.controls['s_benchmark_account'].patchValue(this.dialogRef.componentInstance.currentAccout['account_id'])
      this.editStrategyForm.controls['Benchmark Account'].patchValue(this.dialogRef.componentInstance.currentAccout['account_name'])
      this.dialogRef.close(); 
    });
    console.log('action',this.actionType);
    switch (this.actionType) {
      case 'Create':
      case 'Create_Example': 
      break;
  }
  }

  get  id ()   {return this.editStrategyForm.get('id') } 
  get  name ()   {return this.editStrategyForm.get('name') } 
  get  Level ()   {return this.editStrategyForm.get('level') } 
  get  Description ()   {return this.editStrategyForm.get('description') } 
  get  s_benchmark_account ()   {return this.editStrategyForm.get('s_benchmark_account') } 
  get  Benchmark_Account ()   {return this.editStrategyForm.get('Benchmark Account') } 

}