import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef} from '@angular/material/dialog';
import * as XLSX from 'xlsx'
import { AppClientFormComponent } from '../../forms/app-client-form/app-client-form.component';
import { AppNewAccountComponent } from '../../forms/app-new-account/app-portfolio.component';
@Component({
  selector: 'app-app-clients-table',
  templateUrl: './app-table-clients.component.html',
  styleUrls: ['./app-table-clients.component.css']
})
export class AppClientsTableComponent  {
  
  dialogRef: MatDialogRef<AppClientFormComponent>;
  dialogAccountRef: MatDialogRef<AppNewAccountComponent>
  @Output() public modal_principal_parent = new EventEmitter();
  dtOptions: any = {};
  action ='';
  public readOnly: boolean = false;
  public selectedRow: any;
  constructor(private dialog: MatDialog) {}
ngOnInit(): void {
  this.dtOptions = {
    ajax:  {
      type: 'GET',
      url: '/api/AAM/ClientData/'  ,       
      dataSrc : ''
    },
    columns: [
      {title :'ClientID', 
      data :'idclient'}, 
      {title :'Client Name', 
      data :'clientname'}, 
      {title :'CountryID',  
      data :'idcountrydomicile'},  
      {title :'Proffesional',  
      data :'isclientproffesional'},  
      {title :'Address', 
      data :'address'}, 
      {title :'Contact Person', 
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


chooseClient () {
  let table =  $('#mytable')
  let data = table.DataTable().row({ selected: true }).data()
  this.selectedRow = data;
  this.modal_principal_parent.emit('CLOSE_PARENT_MODAL');
}

openAddFileDialog(actionType) {
  this.dialogRef = this.dialog.open(AppClientFormComponent ,{minHeight:'400px', width:'900px' });
  this.dialogRef.componentInstance.action = actionType;
  this.dialogRef.componentInstance.title = actionType;
  switch (actionType) {
    case 'Create':
    case 'Create_Example': 
     this.dialogRef.componentInstance.title = 'Create New';
    break;
  }
}

openAccountDialog(actionType) {
  this.dialogAccountRef = this.dialog.open(AppNewAccountComponent ,{minHeight:'400px', width:'900px' });
  this.dialogAccountRef.componentInstance.action = actionType;
  this.dialogAccountRef.componentInstance.title = actionType;
  let data = $('#mytable').DataTable().row({ selected: true }).data();
  this.dialogAccountRef.componentInstance.portfolioData = data
  switch (actionType) {
    case 'Create':
    case 'Create_Example': 
     this.dialogRef.componentInstance.title = 'Create New';
    break;
  }

}

exportToExcel() {
  // implement your logic to make the data set from your original dataset.
  let data = [
   { title: "Accession Number", show: true, link: "accessionNumber" },
   { title: "Title", show: true, link: "title" },
   { title: "Sub Title", show: false, link: "subTitle" },
   { title: "Status", show: true, link: "status" },
   { title: "Authors", show: true, link: "authors" },
   { title: "ISBN", show: true, link: "isbn" },
   { title: "ISBN 10", show: false, link: "isbn10" },
   { title: "ISBN 13", show: false, link: "isbn13" },
   { title: "Subjects", show: true, link: "subjects" },
   { title: "Publishers", show: false, link: "publishers" },
   { title: "Vendors", show: false, link: "vendors" },
   { title: "Contributors", show: false, link: "contributors" },
   { title: "Collaborators", show: false, link: "collaborators" }
 ];
 const fileName = "test.xlsx";

 const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
 const wb: XLSX.WorkBook = XLSX.utils.book_new();
 XLSX.utils.book_append_sheet(wb, ws, "test");

 XLSX.writeFile(wb, fileName);
}
}