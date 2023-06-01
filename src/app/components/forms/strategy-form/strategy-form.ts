import { Component,  Input, SimpleChanges, ViewChild,  } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { AppConfimActionComponent } from '../../common-forms/app-confim-action/app-confim-action.component';
import { AppInvestmentDataServiceService } from 'src/app/services/app-investment-data.service.service';
import { TablePortfolios } from '../../tables/portfolios-table/portfolios-table';
import { customAsyncValidators } from 'src/app/services/customAsyncValidators';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { AppTableStrategyComponent } from '../../tables/strategy_structure-table/strategy_structure-table';
import { AuthService } from 'src/app/services/auth.service';
import { AccountsTableModel, portfolioTypes } from 'src/app/models/intefaces';
import { filter, switchMap, tap } from 'rxjs';

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
  disabledFields = ['id','s_benchmark_account'];
  panelOpenState = true;
  editStrategyForm: FormGroup;
  dialogRefConfirm: MatDialogRef<AppConfimActionComponent>;
  isEditForm: boolean = false;
  dialogRef: MatDialogRef<TablePortfolios>;
  actionType : string;
  showStrateryStructure: boolean;
  data: any;
  accessToClientData: string = 'none';
  constructor (
    private fb:FormBuilder, 
    private dialog: MatDialog, 
    private AuthServiceS:AuthService,  
    private InvestmentDataService:AppInvestmentDataServiceService, 
    private CommonDialogsService:HadlingCommonDialogsService,
  ) {
    this.accessToClientData = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToClientData')[0].elementvalue;
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToStrategyData')[0].elementvalue;
    this.disabledControlElements = this.accessState === 'full'? false : true;
    this.disabledControlElements? this.editStrategyForm.disable() : null;
    this.getStrategyData (this.strategyId);
    this.editStrategyForm=this.fb.group ({
      id: {value:'', disabled: true }, 
      name :[null, { updateOn: 'blur'} ], 
      level : {value:'', disabled: false}, 
      description: {value:'', disabled: false}, 
      s_benchmark_account: {value:'', disabled: true},
      'Benchmark Account': {value:'', disabled: true},
    })
   switch (this.action) {
    case 'Create_Example':
      this.data['id']='';
      this.name.markAsTouched();
      this.action='Create';
    break;
    case 'View': 
      this.editStrategyForm.disable();
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
        if (this.action !== 'Create') {
          this.strategyStructureTable.parentStrategyId = data[0].id;
          this.strategyStructureTable.ModelPortfolio = data[0]['level'];
          this.editStrategyForm.patchValue(data[0])
        };
        this.showStrateryStructure = true;
        this.editStrategyForm.controls['name'].setAsyncValidators(customAsyncValidators.strategyCodeCustomAsyncValidator(this.InvestmentDataService, ['Create','Create_Example'].includes(this.action)? 0 : this.id.value)); 
        this.strategyStructureTable.accessState = this.accessState;
        this.strategyStructureTable.disabledControlElements = this.disabledControlElements;
      })
    }
  }
  ngOnChanges(changes: SimpleChanges) {
    this.getStrategyData (changes['strategyId'].currentValue);
  }
  snacksBox(result:any, action?:string){
    if (result['name']=='error') {
      this.CommonDialogsService.snackResultHandler(result)
    } else {
      this.CommonDialogsService.snackResultHandler({name:'success', detail: result + ' strategy'}, action)
      this.InvestmentDataService.sendReloadStrategyList (this.editStrategyForm.controls['id']);
    }
    Object.keys(this.editStrategyForm.controls).forEach(el => this.disabledFields.includes(el)? this.editStrategyForm.get(el).disable() : null);
    ['Edit','Delete'].includes(this.action)? this.dialog.closeAll() : null;
  }
  updateStrategyData(action:string){
    Object.keys(this.editStrategyForm.controls).forEach(el => this.disabledFields.includes(el)? this.editStrategyForm.get(el).enable() : null)
    switch (action) {
      case 'Create_Example':
      case 'Create':
        this.InvestmentDataService.createStrategy(this.editStrategyForm.value).subscribe(result => this.snacksBox(result.length,'Created '))
      break;
      case 'Edit':
        this.InvestmentDataService.updateStrategy(this.editStrategyForm.value).subscribe(result => this.snacksBox(result.length,'Updated '))
      break;
      case 'Delete':
        this.editStrategyForm.controls['id'].enable()
        this.CommonDialogsService.confirmDialog('Delete strategy ' + this.name.value).pipe(
          filter(isConfirmed => (isConfirmed.isConfirmed)),
          switchMap(data => this.InvestmentDataService.deleteStrategy(this.id.value))
        ).subscribe (result => this.snacksBox(result.length,'Deleted '))
      break;
    }
  }
  selectBenchmarkAccount () {
    this.dialogRef = this.dialog.open(TablePortfolios ,{minHeight:'400px', minWidth:'900px', autoFocus: false, maxHeight: '90vh'});
    this.dialogRef.componentInstance.action = 'Select_Benchmark';
    this.dialogRef.componentInstance.modal_principal_parent.pipe (
      filter(strategy=> this.id.value !== strategy['idstategy']),
      tap (strategy => {
        this.dialogRefConfirm = this.dialog.open(AppConfimActionComponent, {panelClass: 'custom-modalbox'});
        let actionToConfim = {
          action:'Select account with different strategy' ,
          isConfirmed: false, 
          data: strategy
        };
        this.dialogRefConfirm.componentInstance.actionToConfim = actionToConfim;
      }),
      switchMap(strategy => this.dialogRefConfirm.afterClosed()),
      filter(el => el['isConfirmed'])
    ).subscribe(data => this.setBenchmarkAccount(data.data));
    this.dialogRef.componentInstance.modal_principal_parent.subscribe (portfolio=> this.id.value === portfolio['idstategy']? this.setBenchmarkAccount(portfolio): null);
  }
  setBenchmarkAccount(data:AccountsTableModel) {
    this.dialogRef.close(); 
    this.editStrategyForm.controls['s_benchmark_account'].patchValue(data.idportfolio)
    this.editStrategyForm.controls['Benchmark Account'].patchValue(data.portfolioname)
  }
  get  id ()   {return this.editStrategyForm.get('id') } 
  get  name ()   {return this.editStrategyForm.get('name') } 
  get  Level ()   {return this.editStrategyForm.get('level') } 
  get  Description ()   {return this.editStrategyForm.get('description') } 
  get  s_benchmark_account ()   {return this.editStrategyForm.get('s_benchmark_account') } 
  get  Benchmark_Account ()   {return this.editStrategyForm.get('Benchmark Account') } 

}