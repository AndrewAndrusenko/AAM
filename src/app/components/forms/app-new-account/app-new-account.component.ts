import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { accountTypes } from 'src/app/models/accounts-table-model';
import { AppInvestmentDataServiceService } from 'src/app/services/app-investment-data.service.service';
import { AppTabServiceService } from 'src/app/services/app-tab-service.service';
import { AppConfimActionComponent } from '../../alerts/app-confim-action/app-confim-action.component';
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
  dialogRefConfirm: MatDialogRef<AppConfimActionComponent>;
  title: any;
  clientData:any;
  accountData : any;
  accountTypes: accountTypes [] = [];
  constructor (private fb:FormBuilder, private AppTabServiceService:AppTabServiceService, private InvestmentDataServiceService : AppInvestmentDataServiceService,   private dialog: MatDialog, public snack:MatSnackBar) {}
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
      this.newAccountForm.controls['idclient'].setValue(this.clientData['idclient'])
      this.newAccountForm.controls['clientname'].setValue(this.clientData['clientname'])
      break;
      case 'Create': 
      this.newAccountForm.controls['idclient'].setValue(this.accountData['idclient'])
      this.newAccountForm.controls['clientname'].setValue(this.accountData['clientname'])
      break;
      case 'Create_Example':
        this.accountData['account_id']='';
        this.newAccountForm.patchValue(this.accountData);
        // this.sname.markAsTouched();
      break;
      case 'Edit':
        this.title = "Edit"
        this.action="Edit"
        this.newAccountForm.patchValue(this.accountData);
      break;   
      case 'Delete': 
        this.newAccountForm.patchValue(this.accountData);
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
  
  updateStrategyData(action:string){
    console.log('action',action);
    switch (action) {
      case 'Create':
      case 'Create_Example':
      case 'Open':
        this.newAccountForm.controls['idclient'].enable()
        this.newAccountForm.controls['idstategy'].enable()
        this.newAccountForm.controls['portfolioname'].enable()
        this.InvestmentDataServiceService.createAccount (this.newAccountForm.value).then ( (result) => {
          if (result['name']=='error') {
            this.snack.open('Error: ' + result['detail'].split("\n", 1).join(""),'OK',{panelClass: ['snackbar-error']}); 
          } else {
            this.snack.open('Created: ' + result + ' account','OK',{panelClass: ['snackbar-success'], duration: 3000});
            this.InvestmentDataServiceService.sendReloadAccountList (Number(this.newAccountForm.controls['idportfolio']));
          }
        })
        this.newAccountForm.controls['idclient'].disable()
        this.newAccountForm.controls['idstategy'].disable()
        this.newAccountForm.controls['portfolioname'].disable()
      break;

      case 'Edit':
        this.newAccountForm.controls['idportfolio'].enable()
        this.newAccountForm.controls['idclient'].enable()
        this.newAccountForm.controls['idstategy'].enable()
        this.newAccountForm.controls['portfolioname'].enable()
        this.InvestmentDataServiceService.updateAccount (this.newAccountForm.value).then ( (result) => {
          if (result['name']=='error') {
            this.snack.open('Error: ' + result['detail'].split("\n", 1).join(""),'OK',{panelClass: ['snackbar-error']} ) 
          } else {
            this.snack.open('Updated: ' + result + ' account','OK',{panelClass: ['snackbar-success'], duration: 3000})
            this.InvestmentDataServiceService.sendReloadAccountList (Number(this.newAccountForm.controls['idportfolio']));
          }
        })
        this.newAccountForm.controls['idclient'].disable()
        this.newAccountForm.controls['idstategy'].disable()
        this.newAccountForm.controls['portfolioname'].disable()
        this.newAccountForm.controls['idportfolio'].disable()

      break;

      case 'Delete':
        this.dialogRefConfirm = this.dialog.open(AppConfimActionComponent, {panelClass: 'custom-modalbox',} );
        this.dialogRefConfirm.componentInstance.actionToConfim = {'action':'Delete Account' ,'isConfirmed': false}
        this.dialogRefConfirm.afterClosed().subscribe (actionToConfim => {
          if (actionToConfim.isConfirmed===true) {
            this.newAccountForm.controls['idportfolio'].enable()
            this.InvestmentDataServiceService.deleteAccount (this.newAccountForm.value['idportfolio']).then ((result) =>{
            if (result['name']=='error') {
              this.snack.open('Error: ' + result['detail'],'OK',{panelClass: ['snackbar-error']} ) 
            this.InvestmentDataServiceService.sendReloadAccountList (Number(this.newAccountForm.controls['idportfolio']));
            } else {
              this.InvestmentDataServiceService.sendReloadAccountList (Number(this.newAccountForm.controls['idportfolio']));
              this.snack.open('Deleted: ' + result + ' account','OK',{panelClass: ['snackbar-success'], duration: 3000})
              this.dialog.closeAll();
            }
          })
          this.newAccountForm.controls['idportfolio'].disable()
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
