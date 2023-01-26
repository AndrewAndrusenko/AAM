import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AppTabServiceService } from 'src/app/services/app-tab-service.service';

@Component({
  selector: 'app-app-instrument-edit-form',
  templateUrl: './app-instrument-edit-form.component.html',
  styleUrls: ['./app-instrument-edit-form.component.css']
})
export class AppInstrumentEditFormComponent implements OnInit {
  editInstrumentForm: FormGroup;
  public action: string;
  @Input()  secid : string;

  constructor (private fb:FormBuilder, private AppTabServiceService:AppTabServiceService) {}

  ngOnInit(): void {
    this.editInstrumentForm=this.fb.group ({
    secid : '', 
    shortname : '', 
    name : '',  
    isin : '',  
    listlevel : '', 
    facevalue : '', 
    faceunit : '',
    primary_board_title : '',
    is_qualified_investors : '',
    registryclosedate : '',  
    lotsize : '', 
    price : '', 
    discountl0 : '', 
    discounth0 : '',
    fullcovered : ''
    })
    console.log('instrumentForm',this.secid)
    if (this.secid !=='') {
      this.AppTabServiceService.getInstrumentData(this.secid).subscribe(data =>{
      this.editInstrumentForm.patchValue(data[0])
      console.log ('details',data[0])
      })
    }
    
    let data = $('#mytable').DataTable().row({ selected: true }).data();
    if (this.action!=='Create') { 
      console.log ('edit',data)
      this.editInstrumentForm.patchValue(data)     } 
  }
  ngOnChanges(changes: SimpleChanges) {
    console.log(changes['secid'].currentValue);
    this.AppTabServiceService.getInstrumentData(changes['secid'].currentValue).subscribe(data => this.editInstrumentForm.patchValue(data[0]))
    // You can also use categoryId.previousValue and 
    // categoryId.firstChange for comparing old and new values
  }
}
