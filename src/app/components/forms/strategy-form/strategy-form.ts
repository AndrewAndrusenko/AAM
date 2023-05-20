import { Component,  Input, SimpleChanges, ViewChild,  } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { AppConfimActionComponent } from '../../common-forms/app-confim-action/app-confim-action.component';
import { AppInvestmentDataServiceService } from 'src/app/services/app-investment-data.service.service';
import { TablePortfolios } from '../../tables/portfolios-table/portfolios-table';
import { customAsyncValidators } from 'src/app/services/customAsyncValidators';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { MatTableDataSource } from '@angular/material/table';
import { AppTableStrategyComponent } from '../../tables/strategy_structure-table/strategy_structure-table';
import { AuthService } from 'src/app/services/auth.service';
import { portfolioTypes } from 'src/app/models/intefaces';

@Component({
  selector: 'app-app-strategy-form',
  templateUrl: './strategy-form.html',
  styleUrls: ['./strategy-form.scss'],
})
export class AppStrategyFormComponent {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  @ViewChild(AppTableStrategyComponent) strategyStructureTable: AppTableStrategyComponent;
  portfolioTypes = portfolioTypes;
  @Input()  strategyId : number;
  @Input() action: string;
  panelOpenState = true;
  editStrategyForm: FormGroup;
  dialogRefConfirm: MatDialogRef<AppConfimActionComponent>;
  isEditForm: boolean = false;
  dialogRef: MatDialogRef<TablePortfolios>;
  title: string;
  actionType : string;
  showStrateryStructure: boolean;
  data: any;
  constructor (
    private fb:FormBuilder, 
    private dialog: MatDialog, 
    private AuthServiceS:AuthService,  
    private InvestmentDataService:AppInvestmentDataServiceService, 
    private CommonDialogsService:HadlingCommonDialogsService,
  ) {
    this.AuthServiceS.verifyAccessRestrictions('accessToStrategyData').subscribe ((accessData) => {
      this.accessState=accessData.elementvalue;
      this.disabledControlElements = this.accessState === 'full'? false : true;
      this.disabledControlElements? this.editStrategyForm.disable() : null;
      
      this.getStrategyData (this.strategyId);
    })
    this.editStrategyForm=this.fb.group ({
      id: {value:'', disabled: true }, 
      name :[null, { updateOn: 'blur'} ], 
      level : {value:'', disabled: false}, 
      description: {value:'', disabled: false}, 
      s_benchmark_account: {value:'', disabled: true},
      'Benchmark Account': {value:'', disabled: true},
    })
    console.log('action',this.action);

   switch (this.action) {
    case 'Create': 
    this.editStrategyForm.patchValue({})
    break;
    case 'Create_Example':
      this.data['id']='';
      this.name.markAsTouched();
    break;
   }  
    this.editStrategyForm.controls['name'].addValidators ( [Validators.required]);
    this.editStrategyForm.controls['description'].addValidators ( [Validators.required]);
    this.editStrategyForm.controls['level'].addValidators ( [Validators.required, Validators.pattern('[0-9]*')]);
    this.editStrategyForm.controls['name'].setAsyncValidators (
      customAsyncValidators.strategyCodeCustomAsyncValidator(this.InvestmentDataService, this.id.value), 
    );  
  }
  getStrategyData (strategyId:number) {
    if (this.accessState !=='none') {
      this.InvestmentDataService.getGlobalStategiesList(strategyId, null, 'Get_Strategy_Data').subscribe(data => {
        this.editStrategyForm.patchValue(data[0])
        this.showStrateryStructure = true;
        this.editStrategyForm.controls['name'].setAsyncValidators(
          customAsyncValidators.strategyCodeCustomAsyncValidator(this.InvestmentDataService, this.id.value)
        ) 
        this.strategyStructureTable.parentStrategyId = data[0].id;
        this.strategyStructureTable.ModelPortfolio = data[0]['level'];
        this.strategyStructureTable.accessState = this.accessState;
        this.strategyStructureTable.disabledControlElements = this.disabledControlElements;
      })
    }
  }
/*   updateStrategyStructure (strategyId:number) {
    console.log('strategyId',strategyId);
    this.InvestmentDataService.getStrategyStructure (strategyId,'0','0').subscribe (portfoliosData => {
      this.strategyStructureTable.dataSource = new MatTableDataSource (portfoliosData)
    })
  } */
  ngOnChanges(changes: SimpleChanges) {
    console.log('changes', changes);
    this.getStrategyData (changes['strategyId'].currentValue);
  }
  snacksBox(result:any, action?:string){
    if (result['name']=='error') {
      this.CommonDialogsService.snackResultHandler(result)
    } else {
      this.CommonDialogsService.snackResultHandler({name:'success', detail: result + 'strategy'}, action)
      this.InvestmentDataService.sendReloadStrategyList (this.editStrategyForm.controls['id']);
    }
    this.editStrategyForm.controls['s_benchmark_account'].disable()
    this.editStrategyForm.controls['id'].disable()
  }
  updateStrategyData(action:string){
    console.log('action',this.action);
    switch (action) {
      case 'Create_Example':
      case 'Create':
        this.editStrategyForm.controls['s_benchmark_account'].enable()
        this.InvestmentDataService.createStrategy(this.editStrategyForm.value).then(result => this.snacksBox(result,'Created '))
        this.editStrategyForm.controls['id'].disable()
        this.editStrategyForm.controls['s_benchmark_account'].enable()
      break;
      case 'Edit':
        this.editStrategyForm.controls['s_benchmark_account'].enable()
        this.editStrategyForm.controls['id'].enable()
        this.InvestmentDataService.updateStrategy(this.editStrategyForm.value).then(result => this.snacksBox(result,'Updated '))
      break;
      case 'Delete':
        this.CommonDialogsService.confirmDialog('Delete strategy ' + this.name.value).subscribe(isConfirmed => {
          if (isConfirmed.isConfirmed) {
            this.editStrategyForm.controls['id'].enable()
            this.InvestmentDataService.deleteStrategy (this.editStrategyForm.value['id']).then (result =>{
              this.snacksBox(result,'Deleted')
              this.CommonDialogsService.dialogCloseAll();
            })
          }
        })
      break;
    }
  }
  selectBenchmarkAccount () {
    this.dialogRef = this.dialog.open(TablePortfolios ,{minHeight:'400px', minWidth:'900px', autoFocus: false, maxHeight: '90vh'});
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