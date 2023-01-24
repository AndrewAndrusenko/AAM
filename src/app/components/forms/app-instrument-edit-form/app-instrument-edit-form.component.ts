import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-app-instrument-edit-form',
  templateUrl: './app-instrument-edit-form.component.html',
  styleUrls: ['./app-instrument-edit-form.component.css']
})
export class AppInstrumentEditFormComponent implements OnInit {
  editInstrumentForm: FormGroup;
  public action: string;
  constructor (private fb:FormBuilder) {}
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
  
  let data = $('#mytable').DataTable().row({ selected: true }).data();
  if (this.action!=='Create') { this.editInstrumentForm.patchValue(data)     } 
  }
  
}
