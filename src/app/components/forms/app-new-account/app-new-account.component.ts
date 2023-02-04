import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AppTabServiceService } from 'src/app/services/app-tab-service.service';

@Component({
  selector: 'app-app-new-account',
  templateUrl: './app-new-account.component.html',
  styleUrls: ['./app-new-account.component.css']
})
export class AppNewAccountComponent implements OnInit {
  newAccountForm: FormGroup;
  public action: string;
  @Input()  client : number;
  dialogRef: MatDialogRef<AppNewAccountComponent>;
  constructor (private fb:FormBuilder, private AppTabServiceService:AppTabServiceService, private dialog: MatDialog) {}
  ngOnInit(): void {
    this.newAccountForm=this.fb.group ({
      idportfolio: {value:'', disabled: true}, 
      idclient: {value:'', disabled: true}, 
      clientname: '', 
      idstategy: {value:'', disabled: true}, 
      portfolioname: '', 
      portleverage: ''
    })
    if (this.client !==0) {
      this.AppTabServiceService.getClientData(this.client, null, 'Get_Client_Data').subscribe(data =>{
      this.newAccountForm.patchValue(data[0])
      console.log ('details',data[0])
      })
    }
    
   let data = $('#mytable').DataTable().row({ selected: true }).data();
    if (this.action!=='Create') { 
      console.log ('edit',data)
      this.newAccountForm.patchValue(data)     }  
  }
  ngOnChanges(changes: SimpleChanges) {
    this.AppTabServiceService.getClientData(changes['client'].currentValue,null,'Get_Client_Data').subscribe(data => {
      // this.editClienttForm.controls .disable()
      this.newAccountForm.patchValue(data[0])
    }
      )
    // You can also use categoryId.previousValue and 
    // categoryId.firstChange for comparing old and new values
  }
  updateClientData(){
    this.AppTabServiceService.updateClient (this.newAccountForm.value)
  }

  openAddNewAccount(actionType) {
console.log('asas','asa');
    this.dialogRef = this.dialog.open(AppNewAccountComponent ,{
      minHeight:'400px',
      width:'900px'
    });
    this.dialogRef.componentInstance.action = actionType;
/*     let table =  $('#mytable')
    let data = table.DataTable().row({ selected: true }).data() */
  }
}
