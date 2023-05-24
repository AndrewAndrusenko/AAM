import { Component, Input, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { AccountsTableModel, accountTypes } from 'src/app/models/intefaces';
import { AppInvestmentDataServiceService } from 'src/app/services/app-investment-data.service.service';
import { AppTableStrategiesComponentComponent } from '../../tables/strategies-table/strategies-table';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { AuthService } from 'src/app/services/auth.service';
@Component({
  selector: 'app-app-portfolio',
  templateUrl: './new-account-form.html',
  styleUrls: ['./new-account-form.css']
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
  title: any;
  accountTypes: accountTypes [] = [];
  formDisabledFields = ['idclient', 'idstategy', 'portfolioname','idportfolio']

  constructor (
    private fb:FormBuilder, 
    private CommonDialogsService:HadlingCommonDialogsService,
    private InvestmentDataService : AppInvestmentDataServiceService,   
    private AuthServiceS:AuthService,  
    private dialog: MatDialog, 
    ) {
      this.newAccountForm=this.fb.group ({
        idportfolio: {value:'', disabled: true, }, 
        account_type: [{value:'', disabled: false}],
        idclient: {value: null, disabled: true}, 
        clientname: {value: null, disabled: true}, 
        idstategy: {value:'', disabled: true}, 
        stategy_name: [{value:'', disabled: false}, [Validators.required]],
        description: {value:'', disabled: true}, 
        portfolioname:[{value:'', disabled: false}, [Validators.required]],
        portleverage: [ {value:0, disabled: false}, [Validators.required, Validators.pattern('[0-9]*')]]
      })
      this.InvestmentDataService.getAccountTypesList (0,'','Get_AccountTypes_List').subscribe (data => {
        this.accountTypes = data;
      })
      this.AuthServiceS.verifyAccessRestrictions('accessToClientData').subscribe ((accessData) => {
        this.accessToClientData = accessData.elementvalue;
        this.AuthServiceS.verifyAccessRestrictions('accessToPortfolioData').subscribe ((accessData) => {
          this.accessState=accessData.elementvalue;
          this.disabledControlElements = this.accessState === 'full'? false : true;
          if (this.accessState !=='none') {
            this.InvestmentDataService.getPortfoliosData('',this.portfolioCode,0,0,'Get_Accounts_By_idPortfolio', this.accessToClientData).subscribe (data => {
              this.portfolioData=data[0];
              this.title = this.action
              this.action = this.action
              this.newAccountForm.patchValue(this.portfolioData);
              switch (this.action) {
                case 'Open':
                case 'Create':  
                this.newAccountForm.reset();
                this.newAccountForm.controls['idclient'].setValue(this.portfolioData['idclient'])
                this.newAccountForm.controls['clientname'].setValue(this.portfolioData['clientname'])
                break;
                case 'Create_Example':
                  this.newAccountForm.controls['portfolioname'].setValue(null);
                  this.title = "Create"
                  this.action = "Create"
                break;
                case 'Delete': 
                case 'View': 
                  this.newAccountForm.disable();
                break;
               }  
            })
          }
        })
      })
    }
  ngOnChanges(changes: SimpleChanges) {
    if (this.accessState !=='none') {
      this.InvestmentDataService.getPortfoliosData('',changes['portfolioCode'].currentValue,0,0, 'Get_Accounts_By_idPortfolio', this.accessToClientData).subscribe (portfoliosData => {
        this.newAccountForm.patchValue(portfoliosData[0])})
    }
  }
  snacksBox(result:any, action?:string) {
    if (result['name']=='error') {
      this.CommonDialogsService.snackResultHandler(result)
    } else {
      this.CommonDialogsService.snackResultHandler({name:'success', detail: result + 'portfolio'}, action)
      this.InvestmentDataService.sendReloadPortfoliosData (Number(this.newAccountForm.controls['idportfolio']));
    }
    this.formDisabledFields.forEach(elem => this.newAccountForm.controls[elem].disable())
  }
  updatePortfolioData(action:string){
    this.formDisabledFields.forEach(elem => this.newAccountForm.controls[elem].enable())
    switch (action) {
      case 'Create':
      case 'Create_Example':
      case 'Open':
        this.InvestmentDataService.createAccount (this.newAccountForm.value).then (result => this.snacksBox(result,'Created'))
      break;
      case 'Edit':
        this.InvestmentDataService.updateAccount (this.newAccountForm.value).then (result => this.snacksBox(result,'Updated'))
      break;
      case 'Delete':
        this.CommonDialogsService.confirmDialog('Delete Portfolio ' + this.newAccountForm.value['portfolioname']).subscribe(isConfirmed => {
          if (isConfirmed.isConfirmed) {
            this.InvestmentDataService.deleteAccount (this.newAccountForm.value['idportfolio']).then (result =>{
              this.snacksBox(result,'Deleted')
              this.CommonDialogsService.dialogCloseAll();
            })
          }
        })
    break;
    }
  }
  selectStrategy (action:string) {
    this.dialogTableStrategiesRef = this.dialog.open(AppTableStrategiesComponentComponent ,{minHeight:'400px', minWidth:'900px', autoFocus: false, maxHeight: '90vh'});
    this.dialogTableStrategiesRef.componentInstance.action = action;
    this.dialogTableStrategiesRef.componentInstance.modal_principal_parent.subscribe ((item)=>{
      this.newAccountForm.controls['idstategy'].patchValue(this.dialogTableStrategiesRef.componentInstance.currentStrategy['id'])
      this.newAccountForm.controls['stategy_name'].patchValue(this.dialogTableStrategiesRef.componentInstance.currentStrategy['name'])
      this.newAccountForm.controls['description'].patchValue(this.dialogTableStrategiesRef.componentInstance.currentStrategy['description'])
      this.dialogTableStrategiesRef.close(); 
    });
  }
  calculateAccountCode () {
    let newNumberS : string;
    let accountType = this.newAccountForm.controls['account_type'].value
    this.InvestmentDataService.getPortfoliosData (accountType, 0,0,0, 'calculateAccountCode',this.accessToClientData).subscribe( (dataA) => {
      if (dataA.length === 0) {newNumberS = "001"} else {
        let data = dataA[0]
        let newNumber = Number (data['portfolioname'].substr(accountType.length)) + 1
        newNumberS = newNumber.toString().padStart (3,"0")
      }
      this.newAccountForm.controls['portfolioname'].setValue (accountType + newNumberS)
    })
  }
}
