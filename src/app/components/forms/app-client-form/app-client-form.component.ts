import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AppTabServiceService } from 'src/app/services/app-tab-service.service';

@Component({
  selector: 'app-app-client-form',
  templateUrl: './app-client-form.component.html',
  styleUrls: ['./app-client-form.component.css']
})
export class AppClientFormComponent implements OnInit {
  editClienttForm: FormGroup;
  public action: string;
  @Input()  client : string;

  constructor (private fb:FormBuilder, private AppTabServiceService:AppTabServiceService) {}
  
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
    if (this.client !=='') {
      this.AppTabServiceService.getClientData(this.client).subscribe(data =>{
      this.editClienttForm.patchValue(data[0])
      console.log ('details',data[0])
      })
    }
    
   let data = $('#mytable').DataTable().row({ selected: true }).data();
    if (this.action!=='Create') { 
      console.log ('edit',data)
      this.editClienttForm.patchValue(data)     }  
  }
  ngOnChanges(changes: SimpleChanges) {
    this.AppTabServiceService.getClientData(changes['client'].currentValue).subscribe(data => {
      // this.editClienttForm.controls .disable()
      this.editClienttForm.patchValue(data[0])
    }
      )
    // You can also use categoryId.previousValue and 
    // categoryId.firstChange for comparing old and new values
  }
  updateClientData(){
    this.editClienttForm.controls['idclient'].enable()
    this.AppTabServiceService.updateClient (this.editClienttForm.value)
    this.editClienttForm.controls['idclient'].disable()
  }
}
