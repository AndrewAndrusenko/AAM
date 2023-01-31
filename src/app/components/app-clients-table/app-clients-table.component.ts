import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef} from '@angular/material/dialog';
import { AppClientFormComponent } from '../forms/app-client-form/app-client-form.component';


@Component({
  selector: 'app-app-clients-table',
  templateUrl: './app-clients-table.component.html',
  styleUrls: ['./app-clients-table.component.css']
})
export class AppClientsTableComponent  {
  isEditForm: boolean = false;
  
  dialogRef: MatDialogRef<AppClientFormComponent>;
  // Must be declared as "any", not as "DataTables.Settings"
  dtOptions: any = {};
  constructor(private dialog: MatDialog) {}
ngOnInit(): void {
  this.dtOptions = {
    ajax:  {
      type: 'GET',
      url: '/api/AAM/ClientData/'  ,       
      dataSrc : ''
    },
    columns: [
      {title :'idclient', 
      data :'idclient'}, 
      {title :'clientname', 
      data :'clientname'}, 
      {title :'idcountrydomicile',  
      data :'idcountrydomicile'},  
      {title :'isclientproffesional',  
      data :'isclientproffesional'},  
      {title :'address', 
      data :'address'}, 
      {title :'contact_person', 
      data :'contact_person'}, 
      {title :'email',
      data :'email'},
      {title :'phone',
      data :'phone'},
      {title :'code',
      data :'code'}
    ],
  buttons: 
{
buttons: 
[      { text: '<i class="fa fa-rotate fa-2x "></i><p style="color:Black,">Reload</p>', className: 'btn  btn-primary', action: ( ) =>   {} 
        },                  
       { extend: 'copy', text:'<i class="fa fa-copy fa-2x "></i><p style="color:Black,">Copy</p>', className: 'btn  btn-primary '},
       { extend: 'excel', text:'<i class="fas fa-file-export fa-2x"></i><p style="color:Black,">To Excel</p>', className: 'btn btn-primary'},
       { extend: 'pdf', text:'<i class="far fa-file-pdf fa-2x"></i><p style="color:Black,">PDF</p>',  className: 'btn btn-primary ', titleAttr: 'PDF'},
       { extend: 'print',  text:'<i class="fa-solid fa-print fa-2x"></i><p style="color:Black,">Print</p>',  className: 'btn btn-primary'},
       { extend: 'colvis', text:'<i class="fa-regular fa-pen-to-square fa-2x"></i><p style="color:Black, width:160px">Hide/Unhide</p>', className: 'btn btn-primary'},
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
  this.dialogRef = this.dialog.open(AppClientFormComponent ,{
    minHeight:'400px',
    width:'900px'
  });
  this.dialogRef.componentInstance.action = actionType;
  let table =  $('#mytable')
  let data = table.DataTable().row({ selected: true }).data()
}
}