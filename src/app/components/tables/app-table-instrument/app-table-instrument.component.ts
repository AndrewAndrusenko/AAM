import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog, MatDialogRef} from '@angular/material/dialog';
import { AppInstrumentEditFormComponent } from '../../forms/app-instrument-edit-form/app-instrument-edit-form.component';
@Component({
  selector: 'app-app-instrument-table',
  templateUrl: './app-table-instrument.component.html',
  styleUrls: ['./app-table-instrument.component.css']
})
export class AppInstrumentTableComponent {
  isEditForm: boolean = false;
  @Input() action: string;
  public currentInstrument: any;
  @Output() public modal_principal_parent = new EventEmitter();
  dialogRef: MatDialogRef<AppInstrumentEditFormComponent>;
  dtOptions: any = {};
  constructor(private dialog: MatDialog) {}
ngOnInit(): void {
  this.dtOptions = {
    ajax:  {
      type: 'GET',
      url: '/api/AAM/InstrumentData/'  ,       
      dataSrc : ''
  },
  columns: [
    {title :'Instument', 
    data :'secid'}, 
    {title :'Short Name', 
    data :'shortname'}, 
    {title :'Name',  
    data :'name'},  
    {title :'ISIN',  
    data :'isin'},  
    {title :'List Level', 
    data :'listlevel'}, 
    {title :'Face Value', 
    data :'facevalue'}, 
    {title :'Face Unit',
    data :'faceunit'},
    {title :'Board_Title',
    data :'primary_board_title'},
    {title :'QI',
    data :'is_qualified_investors'},
    {title :'Registry Close Date',  
    data :'registryclosedate'},  
    {title :'Lot Size', 
    data :'lotsize'}, 
    {title :'Price',
    data :'price'}, 
    {title :'Discountl0', 
    data :'discountl0'}, 
    {title :'fullcovered',
    data :'fullcovered'}, 
    {title :'typename',
    data :'typename'},
    {title :'issuesize',
    data :'issuesize'},
    {title :'is_external',
    data :'is_external'},
    {title :'rtl1',
    data :'rtl1'},
    {title :'rtl2',
    data :'rtl2'}
  ],
  buttons: 
  {
  buttons: 
  [                 
    { extend: 'copy', text:'<p style="color:Black,">Copy</p>', className: 'btn  btn-primary '},
    { extend: 'excel', text:'<p style="color:Black,">To Excel</p>', className: 'btn btn-primary'},
    { extend: 'pdf', text:'<p style="color:Black,">PDF</p>',  className: 'btn btn-primary ', titleAttr: 'PDF'},
    { extend: 'print',  text:'<p style="color:Black,">Print</p>',  className: 'btn btn-primary'},
    { extend: 'colvis', text:'<p style="color:Black, width:160px">Hide/Unhide</p>', className: 'btn btn-primary'},
    { extend: 'pageLength',  className: 'btn btn-primary' }
  ],
  dom: {button: { className: 'btn btn-rounded'}}
  },
  language: {decimal: ',', thousands: '.'},
  pageLength: 25,                            
  dom:  'Bfrtip',
  select: true
  /* order: [11, 'desc']  */
  };
}

openAddFileDialog(actionType) {
  console.log(actionType)
  this.dialogRef = this.dialog.open(AppInstrumentEditFormComponent ,{
    minHeight:'400px',
    width:'900px'
  });
  this.dialogRef.componentInstance.action = actionType;
  let table =  $('#mytable')
        let data = table.DataTable().row({ selected: true }).data()
}

chooseAccount () {
  let table =  $('#mytable')
  let data = table.DataTable().row({ selected: true }).data()
  this.currentInstrument = data;
  console.log('chose account', this.currentInstrument);
  this.modal_principal_parent.emit('CLOSE_PARENT_MODAL');
}
}