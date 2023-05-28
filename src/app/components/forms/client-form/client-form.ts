import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { AppConfimActionComponent } from '../../common-forms/app-confim-action/app-confim-action.component';
import { AppSnackMsgboxComponent } from '../../common-forms/app-snack-msgbox/app-snack-msgbox.component';
import { customAsyncValidators } from 'src/app/services/customAsyncValidators';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { AppInvestmentDataServiceService } from 'src/app/services/app-investment-data.service.service';
import { AuthService } from 'src/app/services/auth.service';
import { ClientData } from 'src/app/models/intefaces';
@Component({
  selector: 'app-app-client-form',
  templateUrl: './client-form.html',
  styleUrls: ['./client-form.css'],
})
export class AppClientFormComponent implements OnInit {
  accessState: string = 'none';
  disabledControlElements: boolean = false;
  accessToPortfolioData: string = 'none';
  editClienttForm: FormGroup;
  @Input() client : number;
  @Input() action: string;
  dialogRefConfirm: MatDialogRef<AppConfimActionComponent>;
  title: string;
  public actionToConfim = {'action':'delete_client' ,'isConfirmed': false}
  public AppSnackMsgbox : AppSnackMsgboxComponent
  constructor (
    private fb:FormBuilder, 
    private CommonDialogsService:HadlingCommonDialogsService,
    private InvestmentDataServiceService : AppInvestmentDataServiceService,   
    private AuthServiceS:AuthService,  
  ) 
  {
    this.accessState = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToClientData')[0].elementvalue;
    this.accessToPortfolioData = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='accessToPortfolioData')[0].elementvalue;
    this.disabledControlElements = this.accessState === 'full'? false : true;
  }
  ngOnInit(): void {
    this.title?  null : this.title = this.action;
    this.editClienttForm=this.fb.group ({
      idclient: {value: 0, disabled: true}, 
      clientname: [null, {validators: [Validators.required], updateOn:'blur' } ],
      idcountrydomicile: [null, [Validators.required, Validators.pattern('[0-9]*')]],
      isclientproffesional: [false],
      address: [null, [Validators.required]],
      contact_person: [null, [Validators.required]],
      email: [null, [Validators.required, Validators.email]],
      phone: [null, [Validators.required, Validators.pattern('[0-9]*') ]],
      code : [null, []]
    })
    this.updataDataSourse(this.client, null, 'Get_Client_Data');
    this.disabledControlElements? this.editClienttForm.disable() : null;
   }
  updataDataSourse (clientId:number, clientname:string, action:string) {
    this.accessState==='none'? null : this.InvestmentDataServiceService.getClientData(clientId, clientname, action).subscribe(data => {
      this.editClienttForm.patchValue(data[0])
      let clientIdtoExclude = ['Create','Create_Example'].includes(this.action)? 0 : data[0].idclient;
      this.editClienttForm.controls['clientname'].setAsyncValidators(customAsyncValidators.clientNameCustomAsyncValidator(this.InvestmentDataServiceService, clientIdtoExclude))
      this.editClienttForm.controls['clientname'].updateValueAndValidity();
    })
  }
  ngOnChanges(changes: SimpleChanges) {
    this.updataDataSourse(changes['client'].currentValue, null, 'Get_Client_Data');
  }
  snacksBox(result:ClientData[], action?:string){
    if (result['name']=='error') {
      this.CommonDialogsService.snackResultHandler(result)
    } else {
      this.CommonDialogsService.snackResultHandler({name:'success', detail: result.length + 'client'}, action);
      this.InvestmentDataServiceService.sendReloadClientTable(result)
    }
  }
  updateClientData(action:string){
    console.log('action',action);
    switch (action) {
      case 'Create_Example':
      case 'Create':
        this.InvestmentDataServiceService.createClient (this.editClienttForm.value).subscribe (result => this.snacksBox(result,'Created') )
        this.editClienttForm.controls['clientname'].markAsDirty;
        this.editClienttForm.controls['idclient'].disable()
      break;
      case 'Edit':
        this.editClienttForm.controls['idclient'].enable()
        this.InvestmentDataServiceService.updateClient (this.editClienttForm.value).subscribe (result => this.snacksBox(result,'Updated'))
        this.editClienttForm.controls['idclient'].disable()
      break;
      case 'Delete':
        this.CommonDialogsService.confirmDialog('Delete ' + this.clientname.value).subscribe(isConfirmed => {
          if (isConfirmed.isConfirmed) {
            this.editClienttForm.controls['idclient'].enable()
            this.InvestmentDataServiceService.deleteClient (this.editClienttForm.value['idclient']).subscribe (result =>{
              this.snacksBox(result,'Deleted')
              this.CommonDialogsService.dialogCloseAll();
            })
            this.editClienttForm.controls['idclient'].disable()
          }
        })
      break;
    }
  }
  get  clientname() {return this.editClienttForm.get('clientname') } 
  get  clientId() {return this.editClienttForm.get('idclient') } 
  get  idcountrydomicile() {return this.editClienttForm.get('idcountrydomicile') } 
  get  isclientproffesional() {return this.editClienttForm.get('isclientproffesional') } 
  get  address() {return this.editClienttForm.get('address') } 
  get  contact_person() {return this.editClienttForm.get('contact_person') } 
  get  email() {return this.editClienttForm.get('email') } 
  get  phone() {return this.editClienttForm.get('phone') } 
  get  code() {return this.editClienttForm.get('code') } 
}