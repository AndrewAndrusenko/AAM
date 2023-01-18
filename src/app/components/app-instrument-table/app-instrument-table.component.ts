import { Component, OnInit } from '@angular/core';


@Component({
  selector: 'app-app-instrument-table',
  templateUrl: './app-instrument-table.component.html',
  styleUrls: ['./app-instrument-table.component.css']
})
export class AppInstrumentTableComponent {
// Must be declared as "any", not as "DataTables.Settings"
dtOptions: any = {};

ngOnInit(): void {
  this.dtOptions = {
                             
    ajax:  {
      type: 'GET',
      url: 'http://localhost:3000/AAM/InstrumentData/'  ,       
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
    {title :'Discounth0',
    data :'discounth0'},
    {title :'FC',
    data :'fullcovered'}
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
/* order: [11, 'desc']  */
  };
}
}