import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppTabServiceService } from 'src/app/services/app-tab-service.service';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { AppConfimActionComponent } from '../../alerts/app-confim-action/app-confim-action.component';
import { AppSnackMsgboxComponent } from '../../app-snack-msgbox/app-snack-msgbox.component';
import { customAsyncValidators } from 'src/app/services/customAsyncValidators';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
@Component({
  selector: 'app-app-client-form',
  templateUrl: './app-client-form.component.html',
  styleUrls: ['./app-client-form.component.css'],
})
export class AppClientFormComponent implements OnInit {
  public editClienttForm: FormGroup;
  @Input()  client : number;
  @Input() action: string;
  dialogRefConfirm: MatDialogRef<AppConfimActionComponent>;
  public title: string;
  public actionToConfim = {'action':'delete_client' ,'isConfirmed': false}
  public AppSnackMsgbox : AppSnackMsgboxComponent
  constructor (
    private fb:FormBuilder, 
    private AppTabServiceService:AppTabServiceService, 
    private CommonDialogsService:HadlingCommonDialogsService,
  ) {}
  ngOnInit(): void {
    this.editClienttForm=this.fb.group ({
      idclient: {value: 0, disabled: true}, 
      clientname: [null, {    validators: [Validators.required], updateOn:'blur' } ],
      idcountrydomicile: [null, [Validators.required, Validators.pattern('[0-9]*')]],
      isclientproffesional: [false],
      address: [null, [Validators.required]],
      contact_person: [null, [Validators.required]],
      email: [null, [Validators.required, Validators.email]],
      phone: [null, [Validators.required, Validators.pattern('[0-9]*') ]],
      code : [null, []]
    })
   
   let data = $('#mytable').DataTable().row({ selected: true }).data();
   switch (this.action) {
    case 'Create': 
    break;
    case 'Create_Example':
      data['idclient'] = 0;
      this.editClienttForm.patchValue(data);
    break;
    case 'Delete': 
      this.editClienttForm.patchValue(data);
    break;
    default :
      this.editClienttForm.patchValue(data);
      this.title = "Edit"
    break; 
   }
   this.editClienttForm.controls['clientname'].setAsyncValidators(
    customAsyncValidators.clientNameCustomAsyncValidator(this.AppTabServiceService, this.clientId.value)
  )
  this.editClienttForm.controls['clientname'].updateValueAndValidity();
  }
  ngOnChanges(changes: SimpleChanges) {
    this.AppTabServiceService.getClientData(changes['client'].currentValue, null, 'Get_Client_Data').subscribe(data => {
      this.editClienttForm.patchValue(data[0])
      this.editClienttForm.controls['clientname'].setAsyncValidators(
        customAsyncValidators.clientNameCustomAsyncValidator(this.AppTabServiceService, this.clientId.value)
      )
      this.editClienttForm.controls['clientname'].updateValueAndValidity();
      this.editClienttForm.updateValueAndValidity();
      // this.editClienttForm.controls['clientname'].markAsDirty();

    })
  }
  snacksBox(result:any, action?:string){
    if (result['name']=='error') {
      this.CommonDialogsService.snackResultHandler(result)
    } else {
      this.CommonDialogsService.snackResultHandler({name:'success', detail: result + 'client'}, action);
      $('#mytable').DataTable().ajax.reload();
    }
  }
  updateClientData(action:string){
    console.log('action',action);
    switch (action) {
      case 'Create_Example':
      case 'Create':
        this.AppTabServiceService.createClient (this.editClienttForm.value).then (result => this.snacksBox(result,'Created') )
        this.editClienttForm.controls['clientname'].markAsDirty;
        this.editClienttForm.controls['idclient'].disable()
      break;
      case 'Edit':
        this.editClienttForm.controls['idclient'].enable()
        this.AppTabServiceService.updateClient (this.editClienttForm.value).then (result => this.snacksBox(result,'Updated'))
        this.editClienttForm.controls['idclient'].disable()
      break;
      case 'Delete':
        this.CommonDialogsService.confirmDialog('Delete ' + this.clientname.value).subscribe(isConfirmed => {
          if (isConfirmed.isConfirmed) {
            this.editClienttForm.controls['idclient'].enable()
            this.AppTabServiceService.deleteClient (this.editClienttForm.value['idclient']).then (result =>{
              this.snacksBox(result,'Deleted')
              this.CommonDialogsService.dialogCloseAll();
            })
            this.editClienttForm.controls['idclient'].disable()
          }
        })
      break;
    }
  }

  get  clientname ()   {return this.editClienttForm.get('clientname') } 
  get  clientId ()   {return this.editClienttForm.get('idclient') } 
  get  idcountrydomicile ()   {return this.editClienttForm.get('idcountrydomicile') } 
  get  isclientproffesional ()   {return this.editClienttForm.get('isclientproffesional') } 
  get  address ()   {return this.editClienttForm.get('address') } 
  get  contact_person ()   {return this.editClienttForm.get('contact_person') } 
  get  email ()   {return this.editClienttForm.get('email') } 
  get  phone ()   {return this.editClienttForm.get('phone') } 
  get  code  ()  {return this.editClienttForm.get('code') } 
}