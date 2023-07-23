import { Component, Input, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { AccountsTableModel, ClientData, StrategiesGlobalData, accountTypes } from 'src/app/models/intefaces.model';
import { AppInvestmentDataServiceService } from 'src/app/services/investment-data.service.service';
import { AppTableStrategiesComponentComponent } from '../../tables/strategies-table.component/strategies-table.component';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { AuthService } from 'src/app/services/auth.service';
import { AppClientsTableComponent } from '../../tables/clients-table.component/clients-table.component';
import { filter, switchMap } from 'rxjs';
@Component({
  selector: 'app-app-portfolio',
  templateUrl: './portfolio-form.component.html',
  styleUrls: ['./portfolio-form.component.css']
})
export class AppNewAccountComponent {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  accessToClientData: string = 'none';
  portfolioData:AccountsTableModel;
  newAccountForm: FormGroup;
  @Input() portfolioCode: number;
  @Input() ClientID: number;
  @Input() action: string;
  dialogTableStrategiesRef: MatDialogRef<AppTableStrategiesComponentComponent>;
  dialogClientsTabletRef: MatDialogRef<AppClientsTableComponent>;
  accountTypes: accountTypes [] = [];

  constructor (
    private fb:FormBuilder, 
    private CommonDialogsService:HadlingCommonDialogsService,
    private InvestmentDataService : AppInvestmentDataServiceService,   
    private AuthServiceS:AuthService,  
    private dialog: MatDialog, 
  ) 
  {
    this.newAccountForm=this.fb.group ({
      idportfolio: {value:null, disabled: false, }, 
      account_type: [{value:null, disabled: false}],
      idclient: [{value:null, disabled: false}, [Validators.required]],
      idstategy: [{value:null, disabled: false}, [Validators.required]],
      clientname: {value:null, disabled: true}, 
      stategy_name: [{value:null, disabled: true}],
      description: {value:null, disabled: true}, 
      portfolioname:[{value:null, disabled: false}, [Validators.required]],
      portleverage: [ {value:0, disabled: false}, [Validators.required, Validators.pattern('[0-9]*')]]
    })
    this.InvestmentDataService.getAccountTypesList (0,'','Get_AccountTypes_List').subscribe (data => this.accountTypes = data);
    this.accessToClientData = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToClientData')[0].elementvalue;
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToPortfolioData')[0].elementvalue;
    this.disabledControlElements = this.accessState === 'full'? false : true;
  }
  ngAfterViewInit(): void {
    this.action === 'View'||this.disabledControlElements? this.newAccountForm.disable() : null;
    if (this.accessState !=='none'&&this.action!=='Create') {
      this.InvestmentDataService.getPortfoliosData('',this.portfolioCode,0,0,'Get_Portfolio_By_idPortfolio', this.accessToClientData).subscribe (data => {
        this.portfolioData=data[0];
        this.newAccountForm.patchValue(this.portfolioData);
        if (this.action === 'Create_Example') {
          this.action ='Create';
          this.newAccountForm.get('portfolioname').setValue(null)
        }
      })
    }
  }
  ngOnChanges (changes: SimpleChanges) {
    if (this.accessState !=='none') {
      this.InvestmentDataService.getPortfoliosData('',changes['portfolioCode'].currentValue,0,0, 'Get_Portfolio_By_idPortfolio', this.accessToClientData).subscribe (portfoliosData => this.newAccountForm.patchValue(portfoliosData[0]))
    }
  }
  snacksBox (result:any, action?:string) {
    if (result['name']=='error') {
      this.CommonDialogsService.snackResultHandler(result)
    } else {
      this.CommonDialogsService.snackResultHandler({name:'success', detail: result + ' portfolio'}, action)
      this.InvestmentDataService.sendReloadPortfoliosData (Number(this.newAccountForm.controls['idportfolio']));
    }
  }
  updatePortfolioData (action:string){
    switch (action) {
      case 'Create':
      case 'Create_Example':
          this.InvestmentDataService.createAccount (this.newAccountForm.value).subscribe (result => this.snacksBox(result.length,'Created'))
      break;
      case 'Edit':
        this.InvestmentDataService.updateAccount (this.newAccountForm.value).subscribe (result => this.snacksBox(result.length,'Updated'))
      break;
      case 'Delete':
        this.CommonDialogsService.confirmDialog('Delete Portfolio ' + this.portfolioname.value).pipe (
          filter (isConfirmed => isConfirmed.isConfirmed),
          switchMap(data => this.InvestmentDataService.deleteAccount (this.portfolioname.value))
        ).subscribe (result =>this.snacksBox(result.length,'Deleted'));
      break;
    }
  }
  selectStrategy (action:string) {
    this.dialogTableStrategiesRef = this.dialog.open(AppTableStrategiesComponentComponent ,{minHeight:'400px', minWidth:'90vw', autoFocus: false, maxHeight: '90vh'});
    let filer = {field:'level', value:2}
    this.dialogTableStrategiesRef.componentInstance.strategyTableInitParams.action = action;
    this.dialogTableStrategiesRef.componentInstance.strategyTableInitParams.filterData = filer;
    this.dialogTableStrategiesRef.componentInstance.modal_principal_parent.subscribe ((item:StrategiesGlobalData)=>{
      this.newAccountForm.controls['idstategy'].patchValue(item.id)
      this.newAccountForm.controls['stategy_name'].patchValue(item.name)
      this.newAccountForm.controls['description'].patchValue(item.description)
      this.dialogTableStrategiesRef.close(); 
    });
  }
  selectClient () {
    this.dialogClientsTabletRef = this.dialog.open(AppClientsTableComponent ,{minHeight:'400px', minWidth:'90vw', autoFocus: false, maxHeight: '90vh'});
    this.dialogClientsTabletRef.componentInstance.action = 'Select';
    this.dialogClientsTabletRef.componentInstance.modal_principal_parent.subscribe ((item:ClientData )=>{
      this.newAccountForm.controls['idclient'].patchValue(item.idclient)
      this.newAccountForm.controls['clientname'].patchValue(item.clientname)
      this.dialogClientsTabletRef.close(); 
    });
  }
  calculateAccountCode () {
    let newNumberS : string;
    let accountType = this.newAccountForm.controls['account_type'].value
    this.InvestmentDataService.getPortfoliosData (accountType, 0,0,0, 'calculateAccountCode',this.accessToClientData).subscribe(dataA => {
      if (dataA.length === 0) {newNumberS = "001"} else {
        let data = dataA[0]
        let newNumber = Number (data['portfolioname'].substr(accountType.length)) + 1
        newNumberS = newNumber.toString().padStart (3,"0")
      }
      this.newAccountForm.controls['portfolioname'].setValue (accountType + newNumberS)
    })
  }
  get id (){return this.newAccountForm.get('idportfolio')}
  get portfolioname (){return this.newAccountForm.get('portfolioname')}
  get idclient (){return this.newAccountForm.get('idclient')}
  get idstategy (){return this.newAccountForm.get('idstategy')}
}
