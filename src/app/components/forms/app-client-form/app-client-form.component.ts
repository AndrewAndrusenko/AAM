import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, NgModel } from '@angular/forms';
import { AppTabServiceService } from 'src/app/services/app-tab-service.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AppConfimActionComponent } from '../../alerts/app-confim-action/app-confim-action.component';

@Component({
  selector: 'app-app-client-form',
  templateUrl: './app-client-form.component.html',
  styleUrls: ['./app-client-form.component.css']
})
export class AppClientFormComponent implements OnInit {
  editClienttForm: FormGroup;
  public action: string;
  @Input()  client : number;
  dialogRefConfirm: MatDialogRef<AppConfimActionComponent>;

  constructor (private fb:FormBuilder, private AppTabServiceService:AppTabServiceService, private dialog: MatDialog) {}
  
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
    if (this.client !==0) {
      this.AppTabServiceService.getClientData(this.client).subscribe(data =>{this.editClienttForm.patchValue(data[0])})
    }
    
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
        this.dialogRefConfirm.componentInstance.action = 'Delete Client';
      
      break;
    }
  }
}
