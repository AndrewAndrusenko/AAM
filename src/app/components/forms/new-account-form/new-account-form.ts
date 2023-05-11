import { Component, Input, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { accountTypes } from 'src/app/models/intefaces';
import { AppInvestmentDataServiceService } from 'src/app/services/app-investment-data.service.service';
import { AppTabServiceService } from 'src/app/services/app-tab-service.service';
import { AppTableStrategiesComponentComponent } from '../../tables/strategies-table/strategies-table';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
@Component({
  selector: 'app-app-portfolio',
  templateUrl: './new-account-form.html',
  styleUrls: ['./new-account-form.css']
})
export class AppNewAccountComponent implements OnInit {
  newAccountForm: FormGroup;
  public action: string;
  @Input() client : number;
  @Input() portfolioData:any;
  dialogTableStrategiesRef: MatDialogRef<AppTableStrategiesComponentComponent>;
  title: any;
  accountTypes: accountTypes [] = [];
  formDisabledFields = ['idclient', 'idstategy', 'portfolioname','idportfolio']

  constructor (
    private fb:FormBuilder, 
    private AppTabServiceService:AppTabServiceService, 
    private CommonDialogsService:HadlingCommonDialogsService,
    private InvestmentDataServiceService : AppInvestmentDataServiceService,   
    private dialog: MatDialog, 
    ) {}
  ngOnInit(): void {
    this.newAccountForm=this.fb.group ({
      idportfolio: {value:'', disabled: true, }, 
      account_type: [{value:'', disabled: false}],
      idclient: {value: null, disabled: true}, 
      clientname: {value: null, disabled: true}, 
      idstategy: {value:'', disabled: true}, 
      stategy_name: [{value:'', disabled: false}, [Validators.required]],
      description: {value:'', disabled: false}, 
      portfolioname:[{value:'', disabled: false}, [Validators.required]],
      portleverage: [ {value:0, disabled: false}, [Validators.required, Validators.pattern('[0-9]*')]]
    })
    this.InvestmentDataServiceService.getAccountTypesList (0,'','Get_AccountTypes_List').subscribe (data => {
      this.accountTypes = data;
    })
    switch (this.action) {
      case 'Open': 
      this.newAccountForm.controls['idclient'].setValue(this.portfolioData['idclient'])
      this.newAccountForm.controls['clientname'].setValue(this.portfolioData['clientname'])
      break;
      case 'Create': 
      this.newAccountForm.controls['idclient'].setValue(this.portfolioData['idclient'])
      this.newAccountForm.controls['clientname'].setValue(this.portfolioData['clientname'])
      break;
      case 'Create_Example':
        this.portfolioData['account_id']='';
        this.newAccountForm.patchValue(this.portfolioData);
      break;
      case 'Edit':
        this.title = "Edit"
        this.action="Edit"
        this.newAccountForm.patchValue(this.portfolioData);
      break;   
      case 'Delete': 
        this.newAccountForm.patchValue(this.portfolioData);
        this.newAccountForm.controls['account_type'].disable()

      break;
      default :
        this.title = "Create"
        this.action = "Create"
      break; 
     }  
  }
  ngOnChanges(changes: SimpleChanges) {
    this.AppTabServiceService.getClientData(changes['client'].currentValue,null,'Get_Client_Data').subscribe(data => {
      this.newAccountForm.patchValue(data[0])
    })
  }
  snacksBox(result:any, action?:string) {
    if (result['name']=='error') {
      this.CommonDialogsService.snackResultHandler(result)
    } else {
      this.CommonDialogsService.snackResultHandler({name:'success', detail: result + 'portfolio'}, action)
      this.InvestmentDataServiceService.sendReloadAccountList (Number(this.newAccountForm.controls['idportfolio']));
    }
    this.formDisabledFields.forEach(elem => this.newAccountForm.controls[elem].disable())
  }
  updatePortfolioData(action:string){
    this.formDisabledFields.forEach(elem => this.newAccountForm.controls[elem].enable())
    switch (action) {
      case 'Create':
      case 'Create_Example':
      case 'Open':
        this.InvestmentDataServiceService.createAccount (this.newAccountForm.value).then (result => this.snacksBox(result,'Created'))
      break;
      case 'Edit':
        this.InvestmentDataServiceService.updateAccount (this.newAccountForm.value).then (result => this.snacksBox(result,'Updated'))
      break;
      case 'Delete':
        this.CommonDialogsService.confirmDialog('Delete Portfolio ' + this.newAccountForm.value['portfolioname']).subscribe(isConfirmed => {
          if (isConfirmed.isConfirmed) {
            this.InvestmentDataServiceService.deleteAccount (this.newAccountForm.value['idportfolio']).then (result =>{
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
    this.AppTabServiceService.getAccountsData (0,0, accountType ,'calculateAccountCode').subscribe( (dataA) => {
      if (dataA.length === 0) {newNumberS = "001"} else {
        let data = dataA[0]
        let newNumber = Number (data['portfolioname'].substr(accountType.length)) + 1
        newNumberS = newNumber.toString().padStart (3,"0")
      }
      this.newAccountForm.controls['portfolioname'].setValue (accountType + newNumberS)
    })
  }
}
