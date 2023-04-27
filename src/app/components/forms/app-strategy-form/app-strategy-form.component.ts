import { Component,  Input, OnInit, SimpleChanges,  } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { AppConfimActionComponent } from '../../alerts/app-confim-action/app-confim-action.component';
import { AppInvestmentDataServiceService } from 'src/app/services/app-investment-data.service.service';
import { TableAccounts } from '../../tables/app-table-accout/app-table-portfolio.component';
import { customAsyncValidators } from 'src/app/services/customAsyncValidators';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
interface Level {
  value: number;
  viewValue: string;
}
@Component({
  selector: 'app-app-strategy-form',
  templateUrl: './app-strategy-form.component.html',
  styleUrls: ['./app-strategy-form.component.scss'],
})
export class AppStrategyFormComponent implements OnInit {
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
  public showStrateryStructure: boolean;
  public data: any;
  constructor (
    private fb:FormBuilder, 
    private dialog: MatDialog, 
    private InvestmentDataServiceService:AppInvestmentDataServiceService, 
    private CommonDialogsService:HadlingCommonDialogsService,
  ) {}
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
      customAsyncValidators.strategyCodeCustomAsyncValidator(this.InvestmentDataServiceService, this.id.value), 
    )  
    // this.editStrategyForm.controls['name'].updateValueAndValidity();
  }
  ngOnChanges(changes: SimpleChanges) {
    console.log('changes', changes);
    this.InvestmentDataServiceService.getGlobalStategiesList(changes['client'].currentValue, null, 'Get_Strategy_Data').subscribe(data => {
      this.editStrategyForm.patchValue(data[0])
      this.strategyId = this.editStrategyForm.controls['id'].value
      this.MP = (this.editStrategyForm.controls['level'].value == 1 ) ? true : false
      console.log('level', this.MP);
      console.log('strategyId',this.strategyId);
      this.showStrateryStructure = true;
      this.editStrategyForm.controls['name'].setAsyncValidators(
        customAsyncValidators.strategyCodeCustomAsyncValidator(this.InvestmentDataServiceService, this.id.value)
      ) 
     this.editStrategyForm.controls['name'].updateValueAndValidity();
    })
  }
  snacksBox(result:any, action?:string){
    if (result['name']=='error') {
      this.CommonDialogsService.snackResultHandler(result)
    } else {
      this.CommonDialogsService.snackResultHandler({name:'success', detail: result + 'strategy'}, action)
      this.InvestmentDataServiceService.sendReloadStrategyList (this.editStrategyForm.controls['id']);
    }
    this.editStrategyForm.controls['s_benchmark_account'].disable()
    this.editStrategyForm.controls['id'].disable()
  }
  updateStrategyData(action:string){
    switch (action) {
      case 'Create_Example':
      case 'Create':
        this.editStrategyForm.controls['s_benchmark_account'].enable()
        this.InvestmentDataServiceService.createStrategy(this.editStrategyForm.value).then(result => this.snacksBox(result,'Created '))
        this.editStrategyForm.controls['id'].disable()
        this.editStrategyForm.controls['s_benchmark_account'].enable()
      break;
      case 'Edit':
        this.editStrategyForm.controls['s_benchmark_account'].enable()
        this.editStrategyForm.controls['id'].enable()
        this.InvestmentDataServiceService.updateStrategy(this.editStrategyForm.value).then(result => this.snacksBox(result,'Updated '))
      break;
      case 'Delete':
        this.CommonDialogsService.confirmDialog('Delete strategy ' + this.name.value).subscribe(isConfirmed => {
          if (isConfirmed.isConfirmed) {
            this.editStrategyForm.controls['id'].enable()
            this.InvestmentDataServiceService.deleteStrategy (this.editStrategyForm.value['id']).then (result =>{
              this.snacksBox(result,'Deleted')
              this.CommonDialogsService.dialogCloseAll();
            })
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
      if (this.id.value !== this.dialogRef.componentInstance.currentAccout['idstategy']) {
        this.dialogRefConfirm = this.dialog.open(AppConfimActionComponent, {panelClass: 'custom-modalbox',} );
        this.dialogRefConfirm.componentInstance.actionToConfim = {'action':'Select account with different strategy' ,'isConfirmed': false}
        this.dialogRefConfirm.afterClosed().subscribe (actionToConfim => {
          if (actionToConfim.isConfirmed===true) {
            this.dialogRef.close(); 
            this.editStrategyForm.controls['s_benchmark_account'].patchValue(this.data['idportfolio'])
            this.editStrategyForm.controls['Benchmark Account'].patchValue(this.data['portfolioname'])
          }
        })
      } else {
      this.editStrategyForm.controls['s_benchmark_account'].patchValue(this.data['idportfolio'])
      this.editStrategyForm.controls['Benchmark Account'].patchValue(this.data['portfolioname'])
      }
      this.dialogRef.close(); 
    });
  }
​
  get  id ()   {return this.editStrategyForm.get('id') } 
  get  name ()   {return this.editStrategyForm.get('name') } 
  get  Level ()   {return this.editStrategyForm.get('level') } 
  get  Description ()   {return this.editStrategyForm.get('description') } 
  get  s_benchmark_account ()   {return this.editStrategyForm.get('s_benchmark_account') } 
  get  Benchmark_Account ()   {return this.editStrategyForm.get('Benchmark Account') } 

}