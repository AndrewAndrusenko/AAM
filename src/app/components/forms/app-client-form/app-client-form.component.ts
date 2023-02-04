import { Component, Injectable, Input, OnInit, SimpleChanges } from '@angular/core';
import { AbstractControl, AsyncValidator, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { AppTabServiceService } from 'src/app/services/app-tab-service.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AppConfimActionComponent } from '../../alerts/app-confim-action/app-confim-action.component';
import { AppSnackMsgboxComponent } from '../../app-snack-msgbox/app-snack-msgbox.component';
import { MatSnackBar} from '@angular/material/snack-bar';
import { count, map, Observable, take } from 'rxjs';
import {  of } from 'rxjs';
import { catchError } from 'rxjs/operators';
@Component({
  selector: 'app-app-client-form',
  templateUrl: './app-client-form.component.html',
  styleUrls: ['./app-client-form.component.css'],
})
export class AppClientFormComponent implements OnInit {
  editClienttForm: FormGroup;
  @Input()  client : number;
  dialogRefConfirm: MatDialogRef<AppConfimActionComponent>;
  @Input() action: string;
  public title: string;
  public actionToConfim = {'action':'delete_client' ,'isConfirmed': false}
  public AppSnackMsgbox : AppSnackMsgboxComponent
  constructor (private fb:FormBuilder, private AppTabServiceService:AppTabServiceService, private dialog: MatDialog, public snack:MatSnackBar, private AlterEgoValidator:UniqueAlterEgoValidator) {}
  
  ngOnInit(): void {
    const clientname = new FormControl('', {
      asyncValidators: [this.AlterEgoValidator.validate.bind(this.AlterEgoValidator)],
      updateOn: 'blur'
    });
    this.editClienttForm=this.fb.group ({
      idclient: {value:'', disabled: true}, 
     /*  clientname: [null,   ],  */
      idcountrydomicile: [null, [Validators.required, Validators.pattern('[0-9]*')]],
      isclientproffesional: [false],
      address: [null, [Validators.required]],
      contact_person: [null, [Validators.required]],
      email: [null, [Validators.required, Validators.email]],
      phone: [null, [Validators.required, Validators.pattern('[0-9]*') ]],
      code : [null, []]
    })
    this.editClienttForm.addControl ('clientname',clientname) 
   let data = $('#mytable').DataTable().row({ selected: true }).data();
   switch (this.action) {
    case 'Create': 
    break;
    case 'Create_Example':
      data['idclient']='';
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
  }

  ngOnChanges(changes: SimpleChanges) {
    this.AppTabServiceService.getClientData(changes['client'].currentValue, null, 'Get_Client_Data').subscribe(data => {this.editClienttForm.patchValue(data[0])})
  }

  updateClientData(action:string){
    
    console.log('action',action);
    switch (action) {
      case 'Create_Example':
      case 'Create':
        console.log('CRE');
        this.AppTabServiceService.createClient (this.editClienttForm.value).then ( (result) => {
          if (result['name']=='error') {
            this.snack.open('Error: ' + result['detail'].split("\n", 1).join(""),'OK',{panelClass: ['snackbar-error']} ) 
          } else {
            this.snack.open('Created: ' + result + ' client','OK',{panelClass: ['snackbar-success'], duration: 3000})
            $('#mytable').DataTable().ajax.reload();
          }
        })
        this.editClienttForm.controls['idclient'].disable()
      break;

      case 'Edit':
        this.editClienttForm.controls['idclient'].enable()
        this.AppTabServiceService.updateClient (this.editClienttForm.value).then ( (result) => {
          if (result['name']=='error') {
            this.snack.open('Error: ' + result['detail'].split("\n", 1).join(""),'OK',{panelClass: ['snackbar-error']} ) 
          } else {
            this.snack.open('Updated: ' + result + ' client','OK',{panelClass: ['snackbar-success'], duration: 3000})
            $('#mytable').DataTable().ajax.reload();
          }
        })
        this.editClienttForm.controls['idclient'].disable()
      break;

      case 'Delete':
        this.dialogRefConfirm = this.dialog.open(AppConfimActionComponent, {panelClass: 'custom-modalbox',} );
        this.dialogRefConfirm.componentInstance.actionToConfim = {'action':'Delete Client' ,'isConfirmed': false}
        this.dialogRefConfirm.afterClosed().subscribe (actionToConfim => {
          console.log('action', actionToConfim)
          if (actionToConfim.isConfirmed===true) {
          this.editClienttForm.controls['idclient'].enable()
          this.AppTabServiceService.deleteClient (this.editClienttForm.value['idclient']).then ((result) =>{
            if (result['name']=='error') {
              this.snack.open('Error: ' + result['detail'],'OK',{panelClass: ['snackbar-error']} ) 
            } else {
              this.snack.open('Deleted: ' + result + ' client','OK',{panelClass: ['snackbar-success'], duration: 3000})
              this.dialog.closeAll();
              $('#mytable').DataTable().ajax.reload();
            }
          })
          this.editClienttForm.controls['idclient'].disable()
         
          }
        })
        console.log('this.editClienttForm.value',this.editClienttForm.value);
      
      break;
    }
  }



  get  clientname ()   {return this.editClienttForm.get('clientname') } 
  get  idcountrydomicile ()   {return this.editClienttForm.get('idcountrydomicile') } 
  get  isclientproffesional ()   {return this.editClienttForm.get('isclientproffesional') } 
  get  address ()   {return this.editClienttForm.get('address') } 
  get  contact_person ()   {return this.editClienttForm.get('contact_person') } 
  get  email ()   {return this.editClienttForm.get('email') } 
  get  phone ()   {return this.editClienttForm.get('phone') } 
  get  code  ()  {return this.editClienttForm.get('code') } 



}

@Injectable({ providedIn: 'root' })
export class UniqueAlterEgoValidator implements AsyncValidator {
  constructor(private AppTabServiceService: AppTabServiceService) {}

  validate(
    control: AbstractControl
  ): Observable<ValidationErrors | null> {
    console.log('control.value', control.value);
    return this.AppTabServiceService.getClientData (null, control.value, 'Check_clientname').pipe(
      map (isTaken => (isTaken.length ? { uniqueAlterEgo: true } : null)),
      catchError(() => of(null))
    );
  }
}
/* export class ClientNameValidator {
  static clientname (control:AbstractControl) {
    return () => {
      console.log('control',control);
      const clientname = control.value.toLowerCase ();
      console.log('cllientname',clientname);
      return AppTabServiceService.bind(this).getClientData (null, clientname, 'Check_clientname').subscribe (data => {
        console.log('data',data);
        return data.length})
  }
 }
} */