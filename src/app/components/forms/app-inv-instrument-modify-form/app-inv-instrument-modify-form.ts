import { AfterViewInit, Component,  EventEmitter,  Input, OnInit, Output, ViewChild,  } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { AppConfimActionComponent } from '../../alerts/app-confim-action/app-confim-action.component';
import { AppSnackMsgboxComponent } from '../../app-snack-msgbox/app-snack-msgbox.component';
import { customAsyncValidators } from 'src/app/services/customAsyncValidators';
import { AppAccountingService } from 'src/app/services/app-accounting.service';
import { bcAccountType_Ext, bcEnityType, instrumentCorpActions, instrumentDetails } from 'src/app/models/accounts-table-model';
import { AppClientsTableComponent } from '../../tables/app-table-clients/app-table-clients.component';
import { TableAccounts } from '../../tables/app-table-accout/app-table-portfolio.component';
import { Subscription } from 'rxjs';
import { MatTabGroup as MatTabGroup } from '@angular/material/tabs';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';

@Component({
  selector: 'app-inv-instrument-modify-form',
  templateUrl: './app-inv-instrument-modify-form.html',
  styleUrls: ['./app-inv-instrument-modify-form.scss'],
})
export class AppInvInstrumentModifyFormComponent implements OnInit, AfterViewInit {

  public panelOpenState = true;
  public instrumentModifyForm: FormGroup;
  @Input() action: string;
  @Input() moexBoards = []
  instrumentDetails:instrumentDetails[] = [];
  instrumentCorpActions:instrumentCorpActions[] = [];
  dialogChoseAccount: MatDialogRef<TableAccounts>;
  @Output() public modal_principal_parent = new EventEmitter();
  public title: string;
  public actionType : string;
  public data: any;
  @ViewChild(MatTabGroup) tabGroup: MatTabGroup;
  formDisabledFields: string[] = [];
  private subscriptionName: Subscription
  constructor (
    private fb:FormBuilder, 
    private dialog: MatDialog, 
    private AccountingDataService:AppAccountingService, 
    private CommonDialogsService:HadlingCommonDialogsService,
  ) 
  { 
    this.formDisabledFields = ['clientId', 'accountId', 'idportfolio']
    this.instrumentModifyForm = this.fb.group ({
/*       accountNo: [null, {validators: [Validators.required], updateOn:'blur' } ],   
      accountTypeExt:[null, [Validators.required]] ,  
      Information: {value:null, disabled: false},  
      clientId: {value:null, disabled: false},  
      currencyCode: [null, [Validators.required, Validators.pattern('[0-9]*') ]],  
      entityTypeCode: [null, [Validators.required]], 
      accountId: {value:null, disabled: false},
      idportfolio: {value:null, disabled: false},
      d_clientname: {value:null, disabled: false}, 
      d_portfolioCode: {value:null, disabled: false} */
      id : {value:null, disabled: false},
      secid:  {value:null, disabled: false}, 
      security_type_title:  {value:null, disabled: false},
      stock_type:  {value:null, disabled: false}, 
      security_type_name:  {value:null, disabled: false}, 
      shortname:  {value:null, disabled: false}, 
      primary_boardid:  {value:null, disabled: false}, 
      board_title:  {value:null, disabled: false}, 
      title:  {value:null, disabled: false},
      category:  {value:null, disabled: false}, 
      name:  {value:null, disabled: false}, 
      isin:  {value:null, disabled: false}, 
      emitent_title:  {value:null, disabled: false}, 
      emitent_inn:  {value:null, disabled: false}, 
      type:  {value:null, disabled: false}, 
      group:  {value:null, disabled: false}, 
      marketprice_boardid:  {value:null, disabled: false}
    })
  }
  ngOnInit(): void {
    this.title = this.action;
    switch (this.action) {
      case 'Create': 
      break;
      case 'Create_Example':
        this.data['id'] = null;
        this.instrumentModifyForm.patchValue(this.data)
        this.title = 'Create';
      break;
      default :
       this.instrumentModifyForm.patchValue(this.data)
      break;
    } 
    if (this.action == 'View') {
      this.instrumentModifyForm.disable();
    }
  }
  ngAfterViewInit(): void {
/*     let accountNoToCheck = (this.action !== 'Create_Example') ? this.accountNo.value : null
    this.accountNo.setAsyncValidators (
      customAsyncValidators.AccountingUniqueAccountNoAsyncValidator(this.AccountingDataService, accountNoToCheck) 
    )
    this.accountNo.updateValueAndValidity();   */
  }
  selectPortfolio () {
/*     this.dialogChoseAccount = this.dialog.open(TableAccounts ,{minHeight:'600px', minWidth:'1300px', autoFocus: false, maxHeight: '90vh'});
    this.dialogChoseAccount.componentInstance.action = "Select";
    this.dialogChoseAccount.componentInstance.readOnly = true;
    this.dialogChoseAccount.componentInstance.clientId = this.clientId.value;
    this.dialogChoseAccount.componentInstance.actionOnAccountTable = "Get_Accounts_By_CientId";
    
    this.dialogChoseAccount.componentInstance.modal_principal_parent.subscribe ((item)=>{
      this.instrumentModifyForm.controls['idportfolio'].patchValue(this.dialogChoseAccount.componentInstance.selectedRow['idportfolio'])
      this.instrumentModifyForm.controls['d_portfolioCode'].patchValue(this.dialogChoseAccount.componentInstance.selectedRow['portfolioname'])
      this.dialogChoseAccount.close(); 
    }); */
  }
  snacksBox(result:any, action?:string){
    if (result['name']=='error') {
      this.CommonDialogsService.snackResultHandler(result)
    } else {
      this.CommonDialogsService.snackResultHandler({name:'success', detail: result + 'account'}, action)
      this.AccountingDataService.sendReloadAccontList (this.instrumentModifyForm.controls['id']);
    }
    this.formDisabledFields.forEach(elem => this.instrumentModifyForm.controls[elem].disable())
  }
  updateAccountData(action:string){
    this.formDisabledFields.forEach(elem => this.instrumentModifyForm.controls[elem].enable())
    switch (action) {
      case 'Create_Example':
      case 'Create':
        this.AccountingDataService.createAccountAccounting(this.instrumentModifyForm.value).then(result => this.snacksBox(result,'Created'))
      break;
      case 'Edit':
        this.AccountingDataService.updateAccountAccounting (this.instrumentModifyForm.value).then(result => this.snacksBox(result,'Updated'))
      break;
      case 'Delete':
        this.CommonDialogsService.confirmDialog('Delete Instrument ' + this.secid.value).subscribe(isConfirmed => {
          if (isConfirmed.isConfirmed) {
            this.instrumentModifyForm.controls['id'].enable()
            this.AccountingDataService.deleteAccountAccounting (this.instrumentModifyForm.value['id']).then (result =>{
              this.snacksBox(result,'Deleted')
              this.CommonDialogsService.dialogCloseAll();
            })
          }
        })
      break;
    }
  }

  get  secid() {return this.instrumentModifyForm.get('secid')}​
  get  security_type_title() {return this.instrumentModifyForm.get('security_type_title')}​
  get  shortname ()   {return this.instrumentModifyForm.get('shortname') } 
  get  isin ()   {return this.instrumentModifyForm.get('isin') } 
  get  primary_boardid ()   {return this.instrumentModifyForm.get('primary_boardid') } 
  get  board_title ()   {return this.instrumentModifyForm.get('board_title') } 
  get  name ()   {return this.instrumentModifyForm.get('name') } 
  get  emitent_inn ()   {return this.instrumentModifyForm.get('emitent_inn') } 

}
