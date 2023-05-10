import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-app-trades-table',
  templateUrl: './z-ds-trades-table.html',
  styleUrls: ['./z-ds-trades-table.css']
})
export class tradesDataTable implements OnInit {
  // Must be declared as "any", not as "DataTables.Settings"
  dtOptions: any = {};

  ngOnInit(): void {
    this.dtOptions = {
                               
      ajax:  {
        type: 'GET',
        url: '/pi2/trades/null/null/4000'  ,       
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
  select:true,
  language: {decimal: ',', thousands: '.'},
  pageLength: 20,                            
  dom:  'Bfrtip',
  order: [11, 'desc'] 
    };
  }
}

