import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-app-trades-table',
  templateUrl: './app-trades-table.component.html',
  styleUrls: ['./app-trades-table.component.css']
})
export class tradesDataTable implements OnInit {
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
      { title: 'Trade ID',
       data: 'trade_num'},
      { title: 'DealDate',
       data: 'dealdate'},
      { title: 'Number ',
       data: 'number'},
      { title: 'Type',
       data: 'dbo_tdealdealtype'},
      { title: 'Quantity' ,
       data: 'qty' },
      { title: 'Price' ,                   
       data: 'instpercent' },                   
      { title: 'Ins_Type',
       data: 'dbo_tinstrumentbrief'},
      { title: 'Counterparty',  
       data: 'dbo_tinstitutionbrief'},  
      { title: 'Value Date' ,  
       data: 'valuedate' },  
      { title: 'Currency 1',   
       data: 'tcurrencybrief'},   
      { title: 'Currency 2',
       data: 'tcurrency2'},
      { title: 'Id' ,
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
  select:true,
  language: {decimal: ',', thousands: '.'},
  pageLength: 20,                            
  dom:  'Bfrtip',
  order: [11, 'desc'] 
    };
  }
}

