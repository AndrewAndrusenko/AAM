import { Component, Input, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { AccountsTableModel, ClientData, StrategiesGlobalData, accountTypes } from 'Frontend-Angular-Src/app/models/interfaces.model';
import { AppInvestmentDataServiceService } from 'Frontend-Angular-Src/app/services/investment-data.service.service';
import { AppTableStrategiesComponentComponent } from '../../tables/strategies-table.component/strategies-table.component';
import { HadlingCommonDialogsService } from 'Frontend-Angular-Src/app/services/hadling-common-dialogs.service';
import { AuthService } from 'Frontend-Angular-Src/app/services/auth.service';
import { AppClientsTableComponent } from '../../tables/clients-table.component/clients-table.component';
import { Subscription, filter, switchMap } from 'rxjs';
@Component({
  selector: 'app-app-portfolio',
  templateUrl: './portfolio-form.component.html',
  styleUrls: ['./portfolio-form.component.scss']
})
export class AppNewAccountComponent {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  accessToClientData: string = 'none';
  portfolioData:AccountsTableModel;
  portfolioForm: FormGroup;
  summaryData:{npv:number,managementFee:number,perfomanceFee:number,PnL:number}
  @Input() portfolioCode: number;
  @Input() ClientID: number;
  @Input() action: string;
  @Input() summaryShow: boolean=false;
  dialogTableStrategiesRef: MatDialogRef<AppTableStrategiesComponentComponent>;
  dialogClientsTabletRef: MatDialogRef<AppClientsTableComponent>;
  accountTypes: accountTypes [] = [];
  subscriptions = new Subscription()
  panelOpenState1:boolean=true;
  constructor (
    private CommonDialogsService:HadlingCommonDialogsService,
    private InvestmentDataService : AppInvestmentDataServiceService,   
    private AuthService:AuthService,  
    private fb:FormBuilder, 
    private dialog: MatDialog, 
  ) 
  {    
    this.portfolioForm=this.fb.group ({
    idportfolio: {value:null, disabled: false, }, 
    account_type: [{value:null, disabled: false}],
    idclient: [{value:null, disabled: false}, [Validators.required]],
    idstategy: [{value:null, disabled: false}, [Validators.required]],
    clientname: {value:null, disabled: true}, 
    stategy_name: [{value:null, disabled: true}],
    description: {value:null, disabled: true}, 
    portfolioname:[{value:null, disabled: false}, [Validators.required]],
    user_id:[this.AuthService.userId]
  }) }
  ngOnInit(): void {
    this.InvestmentDataService.getAccountTypesList (0,'','Get_AccountTypes_List').subscribe (data => this.accountTypes = data);
    this.accessToClientData = this.AuthService.accessRestrictions.filter(el =>el.elementid==='accessToClientData')[0].elementvalue;
    this.accessState = this.AuthService.accessRestrictions.filter(el =>el.elementid==='accessToClientData')[0].elementvalue;
    this.disabledControlElements = this.accessState === 'full'? false : true;
    this.InvestmentDataService.recieveSummaryPortfolioData().subscribe(data=>{
      this.summaryData=data;
      this.summaryShow=true;
    })
    this.action === 'View'||this.disabledControlElements? this.portfolioForm.disable() : null;
    if (this.accessState !=='none'&&this.action!=='Create') {
      this.InvestmentDataService.getPortfoliosData('',this.portfolioCode,0,undefined,'Get_Portfolio_By_idPortfolio',null, this.accessToClientData).subscribe (data => {
        this.portfolioData=data[0];
        this.portfolioForm.patchValue(this.portfolioData);
        if (this.action === 'Create_Example') {
          this.action ='Create';
          this.portfolioForm.get('portfolioname').setValue(null)
        }
      })
    } 
  }
  ngOnChanges (changes: SimpleChanges) {
    if (this.accessState !=='none'&&this.portfolioname.value!==changes['portfolioCode'].currentValue) {
      this.InvestmentDataService.getPortfoliosData('',changes['portfolioCode'].currentValue,0,undefined, 'Get_Portfolio_By_idPortfolio', null,this.accessToClientData).subscribe (portfoliosData => this.portfolioForm.patchValue(portfoliosData[0]));
    }
  }
  snacksBox (result:{name:string,detail:string}|AccountsTableModel[], action?:string) {
    if (result['name']=='error') {
      this.CommonDialogsService.snackResultHandler(result)
    } else {
      this.CommonDialogsService.snackResultHandler({name:'success', detail: (result as AccountsTableModel[]).length + ' portfolio'}, action)
      this.InvestmentDataService.sendReloadPortfoliosData (true);
    }
  }
  updatePortfolioData (action:string){
    switch (action) {
      case 'Create':
      case 'Create_Example':
          this.InvestmentDataService.updateAccount (this.portfolioForm.value,'Create').subscribe (result => this.snacksBox(result,'Created'))
      break;
      case 'Edit':
        this.InvestmentDataService.updateAccount (this.portfolioForm.value,'Edit').subscribe (result => this.snacksBox(result,'Updated'))
      break;
      case 'Delete':
        this.CommonDialogsService.confirmDialog('Delete Portfolio ' + this.portfolioname.value).pipe (
          filter (isConfirmed => isConfirmed.isConfirmed),
          switchMap(() => this.InvestmentDataService.updateAccount (this.portfolioForm.value,'Delete'))
        ).subscribe (result =>this.snacksBox(result,'Deleted'));
      break;
    }
  }
  selectStrategy (action:string) {
    this.dialogTableStrategiesRef = this.dialog.open(AppTableStrategiesComponentComponent ,{minHeight:'400px', minWidth:'90vw', autoFocus: false, maxHeight: '90vh'});
    let filer = {field:'level', value:2}
    this.dialogTableStrategiesRef.componentInstance.strategyTableInitParams.action = action;
    this.dialogTableStrategiesRef.componentInstance.strategyTableInitParams.filterData = filer;
    this.dialogTableStrategiesRef.componentInstance.modal_principal_parent.subscribe ((item:StrategiesGlobalData)=>{
      this.portfolioForm.controls['idstategy'].patchValue(item.id)
      this.portfolioForm.controls['stategy_name'].patchValue(item.name)
      this.portfolioForm.controls['description'].patchValue(item.description)
      this.dialogTableStrategiesRef.close(); 
    });
  }
  selectClient () {
    this.dialogClientsTabletRef = this.dialog.open(AppClientsTableComponent ,{minHeight:'400px', minWidth:'90vw', autoFocus: false, maxHeight: '90vh'});
    this.dialogClientsTabletRef.componentInstance.action = 'Select';
    this.dialogClientsTabletRef.componentInstance.modal_principal_parent.subscribe ((item:ClientData )=>{
      this.portfolioForm.controls['idclient'].patchValue(item.idclient)
      this.portfolioForm.controls['clientname'].patchValue(item.clientname)
      this.dialogClientsTabletRef.close(); 
    });
  }
  calculateAccountCode () {
    let newNumberS : string;
    let accountType = this.portfolioForm.controls['account_type'].value
    this.InvestmentDataService.getPortfoliosData (accountType, 0,0,undefined, 'calculateAccountCode',null,this.accessToClientData).subscribe(dataA => {
      if (dataA.length === 0) {newNumberS = "001"} else {
        let data = dataA[0]
        let newNumber = Number (data['portfolioname'].substr(accountType.length)) + 1
        newNumberS = newNumber.toString().padStart (3,"0")
      }
      this.portfolioForm.controls['portfolioname'].setValue (accountType + newNumberS)
    })
  }
  get id (){return this.portfolioForm.get('idportfolio')}
  get portfolioname (){return this.portfolioForm.get('portfolioname')}
  get idclient (){return this.portfolioForm.get('idclient')}
  get idstategy (){return this.portfolioForm.get('idstategy')}
}
