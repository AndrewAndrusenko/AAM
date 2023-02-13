import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { accountTypes } from 'src/app/models/accounts-table-model';
import { AppInvestmentDataServiceService } from 'src/app/services/app-investment-data.service.service';
import { AppTabServiceService } from 'src/app/services/app-tab-service.service';
import { AppTableStrategiesComponentComponent } from '../../tables/app-table-strategies.component/app-table-strategies.component.component';
@Component({
  selector: 'app-app-new-account',
  templateUrl: './app-new-account.component.html',
  styleUrls: ['./app-new-account.component.css']
})
export class AppNewAccountComponent implements OnInit {
  newAccountForm: FormGroup;
  public action: string;
  @Input()  client : number;
  dialogTableStrategiesRef: MatDialogRef<AppTableStrategiesComponentComponent>;
  title: any;
  clientData:any;
  accountTypes: accountTypes [] = [];
  constructor (private fb:FormBuilder, private AppTabServiceService:AppTabServiceService, private InvestmentDataServiceService : AppInvestmentDataServiceService,   private dialog: MatDialog) {}
  ngOnInit(): void {
    this.newAccountForm=this.fb.group ({
      idportfolio: {value:'', disabled: true, }, 
      account_type: [{value:'', disabled: false}, [Validators.required]],
      idclient: {value:this.clientData['idclient'], disabled: true}, 
      clientname: {value: this.clientData['clientname'], disabled: true}, 
      idstategy: {value:'', disabled: true}, 
      stategy_name: [{value:'', disabled: false}, [Validators.required]],
      description: {value:'', disabled: false}, 
      portfolioname:[{value:'', disabled: true}, [Validators.required]],
      portleverage: [ {value:'', disabled: false}, [Validators.required, Validators.pattern('[0-9]*')]]
    })
    this.InvestmentDataServiceService.getAccountTypesList (0,'','Get_AccountTypes_List').subscribe (data => {
      this.accountTypes = data;
    })
 
    /* if (this.client !==0) {
      this.AppTabServiceService.getClientData(this.client, null, 'Get_Client_Data').subscribe(data =>{
      this.newAccountForm.patchValue(data[0])
      console.log ('details',data[0])
      })
    }
    let data = $('#mytable').DataTable().row({ selected: true }).data();
    if (this.action!=='Create') { 
      console.log ('edit',data)
      this.newAccountForm.patchValue(data)    
    }   */
  }
  ngOnChanges(changes: SimpleChanges) {
    this.AppTabServiceService.getClientData(changes['client'].currentValue,null,'Get_Client_Data').subscribe(data => {
      this.newAccountForm.patchValue(data[0])
    })
  }
  updateClientData(){
    this.AppTabServiceService.updateClient (this.newAccountForm.value)
  }

  selectStrategy (action:string) {
    this.dialogTableStrategiesRef = this.dialog.open(AppTableStrategiesComponentComponent ,{minHeight:'400px', minWidth:'900px' });
    this.dialogTableStrategiesRef.componentInstance.modal_principal_parent.subscribe ((item)=>{
      this.newAccountForm.controls['idstategy'].patchValue(this.dialogTableStrategiesRef.componentInstance.currentStrategy['id'])
      this.newAccountForm.controls['stategy_name'].patchValue(this.dialogTableStrategiesRef.componentInstance.currentStrategy['name'])
      this.newAccountForm.controls['description'].patchValue(this.dialogTableStrategiesRef.componentInstance.currentStrategy['description'])
      this.dialogTableStrategiesRef.close(); 
    });
  }
  calculateAccountCode () {
    let accountType = this.newAccountForm.controls['account_type'].value
    console.log('this.newAccountForm.controls', accountType) ;
    this.AppTabServiceService.getAccountsData (0,0, accountType ,'calculateAccountCode').subscribe( (dataA) => {
      let data = dataA[0]
      console.log('data',data);
      console.log('nm', data['account_name'].substr(accountType.length));
      let newNumber = Number (data['account_name'].substr(accountType.length)) + 1
      let newNumberS = newNumber.toString().padStart (3,"0")
      console.log('new', accountType + newNumberS);
      this.newAccountForm.controls['portfolioname'].setValue (accountType + newNumberS)
    })
  }
}
