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
import { filter, switchMap } from 'rxjs';
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
    this.editClienttForm=this.fb.group ({
      idclient: {value: 0, disabled: false}, 
      clientname: [null, {validators: [Validators.required], updateOn:'blur' } ],
      idcountrydomicile: [null, [Validators.required, Validators.pattern('[0-9]*')]],
      isclientproffesional: [false],
      address: [null, [Validators.required]],
      contact_person: [null, [Validators.required]],
      email: [null, [Validators.required, Validators.email]],
      phone: [null, [Validators.required, Validators.pattern('[0-9]*') ]],
      code : [null, []]
    });

   }
  ngAfterViewInit(): void {
  this.updataDataSourse(this.client, null, 'Get_Client_Data');
  this.disabledControlElements? this.editClienttForm.disable() : null;
  }
  updataDataSourse (clientId:number, clientname:string, action:string) {
    this.accessState==='none'? null : this.InvestmentDataServiceService.getClientData(clientId, clientname, action).subscribe(data => {
      this.editClienttForm.patchValue(data[0])
      if (this.action === 'Create_Example') {
        clientId = 0;
        this.action ='Create';
      }
      this.editClienttForm.controls['clientname'].setAsyncValidators(customAsyncValidators.clientNameCustomAsyncValidator(this.InvestmentDataServiceService, clientId))
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
      this.CommonDialogsService.snackResultHandler({name:'success', detail: result.length + ' client'}, action);
      this.InvestmentDataServiceService.sendReloadClientTable(result)
    }
  }
  updateClientData(action:string){
    switch (action) {
      case 'Create_Example':
      case 'Create':
        this.InvestmentDataServiceService.createClient (this.editClienttForm.value).subscribe (result => this.snacksBox(result,'Created') )
      break;
      case 'Edit':
        this.InvestmentDataServiceService.updateClient (this.editClienttForm.value).subscribe (result => this.snacksBox(result,'Updated'))
      break;
      case 'Delete':
        this.CommonDialogsService.confirmDialog('Delete ' + this.clientname.value).pipe(
          filter(isConfirmed => isConfirmed.isConfirmed),
          switchMap(data => this.InvestmentDataServiceService.deleteClient (this.clientId.value))
        ).subscribe (result => this.snacksBox(result,'Deleted'))
      // this.CommonDialogsService.dialogCloseAll();
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