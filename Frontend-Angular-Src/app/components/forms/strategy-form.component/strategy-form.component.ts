import { Component,  Input, SimpleChanges, ViewChild} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { AppConfimActionComponent } from '../../common-forms/app-confim-action/app-confim-action.component';
import { AppInvestmentDataServiceService } from 'Frontend-Angular-Src/app/services/investment-data.service.service';
import { TablePortfolios } from '../../tables/portfolios-table.component/portfolios-table.component';
import { customAsyncValidators } from 'Frontend-Angular-Src/app/services/customAsyncValidators.service';
import { HadlingCommonDialogsService } from 'Frontend-Angular-Src/app/services/hadling-common-dialogs.service';
import { AppTableStrategyComponent } from '../../tables/strategy_structure-table.component/strategy_structure-table.component';
import { AuthService } from 'Frontend-Angular-Src/app/services/auth.service';
import { AccountsTableModel, StrategiesGlobalData, portfolioTypes } from 'Frontend-Angular-Src/app/models/interfaces.model';
import { filter, of, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-app-strategy-form',
  templateUrl: './strategy-form.component.html',
  styleUrls: ['./strategy-form.component.scss'],
})
export class AppStrategyFormComponent {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  @ViewChild(AppTableStrategyComponent) strategyStructureTable: AppTableStrategyComponent;
  portfolioTypes = portfolioTypes;
  @Input()  strategyId : number;
  @Input() MP : number; 
  @Input() action: string;
  panelOpenState = true;
  panelOpenState1 = true;
  editStrategyForm: FormGroup;
  dialogRefConfirm: MatDialogRef<AppConfimActionComponent>;
  isEditForm: boolean = false;
  dialogRef: MatDialogRef<TablePortfolios>;
  actionType : string;
  showStrateryStructure: boolean;
  data: StrategiesGlobalData;
  accessToClientData: string = 'none';
  constructor (
    private fb:FormBuilder, 
    private dialog: MatDialog, 
    private AuthServiceS:AuthService,  
    private InvestmentDataService:AppInvestmentDataServiceService, 
    private CommonDialogsService:HadlingCommonDialogsService,
  ) 
  {
    this.editStrategyForm=this.fb.group ({
      id: {value:'', disabled: false }, 
      sname :[null, {validators: [Validators.required], updateOn:'blur' } ],
      s_level_id : [null, [Validators.required]], 
      s_description: [null, [Validators.required]],
      s_benchmark_account: [null],
      'Benchmark Account': {value:'', disabled: true},
    })
   }
  ngOnInit(): void {
    this.accessToClientData = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToClientData')[0].elementvalue;
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToStrategyData')[0].elementvalue;
    this.disabledControlElements = this.accessState === 'full'? false : true;
    this.strategyId? this.getStrategyData (this.strategyId) :null;
    this.action === 'View'||this.disabledControlElements? this.editStrategyForm.disable() : null;
  }
  getStrategyData (strategyId:number) {
    if (this.accessState !=='none') {
      this.InvestmentDataService.getGlobalStategiesList(strategyId, null, 'Get_Strategy_Data').subscribe(data => {
        if (this.action !== 'Create') {
          this.strategyStructureTable.parentStrategyId = data[0].id;
          this.strategyStructureTable.ModelPortfolio = data[0]['s_level_id'];
          this.editStrategyForm.patchValue(data[0])
          this.action === 'Create_Example'? this.name.setErrors({uniqueStrategyCode:true}) : null;
        };
        this.editStrategyForm.controls['sname'].setAsyncValidators(customAsyncValidators.strategyCodeCustomAsyncValidator(this.InvestmentDataService, ['Create','Create_Example'].includes(this.action)? 0 : this.strategyId, this.name.value,
        this.action === 'Create_Example'? this.name.errors : null)); 
        this.showStrateryStructure = true;
        this.strategyStructureTable.accessState = this.accessState;
        this.strategyStructureTable.disabledControlElements = this.disabledControlElements;
        this.name.updateValueAndValidity();
      })
    }
  }
  ngOnChanges(changes: SimpleChanges) {
    changes['strategyId'].currentValue? this.getStrategyData (changes['strategyId'].currentValue):null;
  }
  snacksBox(result:{name:string,detail:string}|StrategiesGlobalData[], action?:string){
    if (result['name']=='error') {
      this.CommonDialogsService.snackResultHandler(result)
    } else {
      this.CommonDialogsService.snackResultHandler({name:'success', detail: (result as StrategiesGlobalData[]).length + ' strategy'}, action)
      this.InvestmentDataService.sendReloadStrategyList (this.id.value );
    }
    ['Edit','Delete'].includes(this.action)? this.dialog.closeAll() : null;
  }
  updateStrategyData(action:string){
    switch (action) {
      case 'Create_Example':
      case 'Create':
        this.InvestmentDataService.updateStrategy(this.editStrategyForm.value,'Create').subscribe(result => this.snacksBox(result,'Created '))
      break;
      case 'Edit':
        this.InvestmentDataService.updateStrategy(this.editStrategyForm.value,'Edit').subscribe(result => this.snacksBox(result,'Updated '))
      break;
      case 'Delete':
        this.CommonDialogsService.confirmDialog('Delete strategy ' + this.name.value,'Delete').pipe(
          filter(isConfirmed => (isConfirmed.isConfirmed)),
          switchMap(() => this.InvestmentDataService.updateStrategy(this.editStrategyForm.value,'Delete'))
        ).subscribe (result => this.snacksBox(result,'Deleted '))
      break;
    }
  }
  selectBenchmarkAccount () {
    let portfolioData:AccountsTableModel
    this.dialogRef = this.dialog.open(TablePortfolios ,{minHeight:'400px', minWidth:'900px', autoFocus: false, maxHeight: '90vh'});
    this.dialogRef.componentInstance.action = 'Select_Benchmark';
    this.dialogRef.componentInstance.modal_principal_parent.pipe (
      tap(data=>portfolioData=data),
      // filter(portfolio=> this.id.value !== strategy.idstategy),
      switchMap((portfolio)=> this.id.value !== portfolio.idstategy? this.CommonDialogsService.confirmDialog('Select account with different strategy','Confirm' ):of({isConfirmed:true})),
/*       tap (strategy => {
       
        this.dialogRefConfirm = this.dialog.open(AppConfimActionComponent, {panelClass: 'custom-modalbox'});
        let actionToConfim = {
          action:'Select account with different strategy' ,
          isConfirmed: false, 
          data: strategy
        };
        this.dialogRefConfirm.componentInstance.actionToConfim = actionToConfim;
      }), */
      // switchMap(strategy => this.dialogRefConfirm.afterClosed()),
      filter(el => el.isConfirmed)
    ).subscribe(data => this.setBenchmarkAccount(portfolioData));
    this.dialogRef.componentInstance.modal_principal_parent.subscribe (portfolio=> this.id.value === portfolio['idstategy']? this.setBenchmarkAccount(portfolio): null);
  }
  setBenchmarkAccount(data:AccountsTableModel) {
    this.dialogRef.close(); 
    this.editStrategyForm.controls['s_benchmark_account'].patchValue(data.idportfolio)
    this.editStrategyForm.controls['Benchmark Account'].patchValue(data.portfolioname)
  }
  get  id ()   {return this.editStrategyForm.get('id') } 
  get  name ()   {return this.editStrategyForm.get('sname') } 
  get  Level ()   {return this.editStrategyForm.get('s_level_id') } 
  get  Description ()   {return this.editStrategyForm.get('s_description') } 
  get  s_benchmark_account ()   {return this.editStrategyForm.get('s_benchmark_account') } 
  get  Benchmark_Account ()   {return this.editStrategyForm.get('Benchmark Account') } 

}