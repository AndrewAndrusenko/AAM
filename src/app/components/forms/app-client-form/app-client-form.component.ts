import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, NgModel } from '@angular/forms';
import { AppTabServiceService } from 'src/app/services/app-tab-service.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AppConfimActionComponent } from '../../alerts/app-confim-action/app-confim-action.component';
import { AppSnackMsgboxComponent } from '../../app-snack-msgbox/app-snack-msgbox.component';
import { MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-app-client-form',
  templateUrl: './app-client-form.component.html',
  styleUrls: ['./app-client-form.component.css'],
})
export class AppClientFormComponent implements OnInit {
  editClienttForm: FormGroup;
  @Input()  client : number;
  dialogRefConfirm: MatDialogRef<AppConfimActionComponent>;
  public action: string;
  public actionToConfim = {'action':'delete_client' ,'isConfirmed': false}
  public AppSnackMsgbox : AppSnackMsgboxComponent
  constructor (private fb:FormBuilder, private AppTabServiceService:AppTabServiceService, private dialog: MatDialog, public snack:MatSnackBar) {}
  
  ngOnInit(): void {
    this.editClienttForm=this.fb.group ({
      idclient: {value:'', disabled: true}, 
      clientname: '', 
      idcountrydomicile: '', 
      isclientproffesional: '', 
      address: '', 
      contact_person: '', 
      email: '', 
      phone: '', 
      code : ''
    })
    
   let data = $('#mytable').DataTable().row({ selected: true }).data();
    if (this.action!=='Create') {this.editClienttForm.patchValue(data)}  
  }

  ngOnChanges(changes: SimpleChanges) {
    this.AppTabServiceService.getClientData(changes['client'].currentValue).subscribe(data => {this.editClienttForm.patchValue(data[0])})
  }

  updateClientData(action:string){
    
    console.log('action',action);
    switch (action) {
      case 'Create':
      break;
      case 'Update':
        this.editClienttForm.controls['idclient'].enable()
        this.AppTabServiceService.updateClient (this.editClienttForm.value)
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
              this.snack.open('Deleted: ' + result + ' rows','OK',{panelClass: ['snackbar-success'], duration: 3000})
              this.dialog.closeAll()
            }
          })
          this.editClienttForm.controls['idclient'].disable()
         
          }
        })
        console.log('this.editClienttForm.value',this.editClienttForm.value);
      
      break;
    }
  }
}
