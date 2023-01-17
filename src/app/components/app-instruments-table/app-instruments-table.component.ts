import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-app-instruments-table',
  templateUrl: './app-instruments-table.component.html',
  styleUrls: ['./app-instruments-table.component.css']
})
export class ButtonsExtensionComponent implements OnInit {
  // Must be declared as "any", not as "DataTables.Settings"
  dtOptions: any = {};

  ngOnInit(): void {
    this.dtOptions = {
                               
      ajax:  {
        type: 'GET',
        url: 'http://localhost:3002/trades/null/null/4000'  ,       
        dataSrc : ''
    },
    
    columns: [
      { title: 'trade_num',
       data: 'trade_num'},
      { title: 'dealdate',
       data: 'dealdate'},
      { title: 'number',
       data: 'number'},
      { title: 'dbo_tdealdealtype',
       data: 'dbo_tdealdealtype'},
      { title: 'qty' ,
       data: 'qty' },
      { title: 'instpercent' ,                   
       data: 'instpercent' },                   
      { title: 'dbo_tinstrumentbrief',
       data: 'dbo_tinstrumentbrief'},
      { title: 'dbo_tinstitutionbrief',  
       data: 'dbo_tinstitutionbrief'},  
      { title: 'valuedate' ,  
       data: 'valuedate' },  
      { title: 'tcurrencybrief',   
       data: 'tcurrencybrief'},   
      { title: 'tcurrency2',
       data: 'tcurrency2'},
      { title: 'dealid' ,
       data: 'dealid' },
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
  dom:  '<"dtsp-dataTable"Bfrtip>',
    };
  }
}
