import { Component, Input } from '@angular/core';
import { MatDialog as MatDialog, MatDialogRef as MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-app-confim-action',
  templateUrl: './app-confim-action.component.html',
  styleUrls: ['./app-confim-action.component.css']
})
export class AppConfimActionComponent {
  constructor(private dialog: MatDialog, public dialogRefConfirm: MatDialogRef<AppConfimActionComponent>) {
  }
  public actionToConfim : {'action':string ,'isConfirmed': boolean, data?:any,buttonLabel?:string}
  @Input () jsonData:any;
  @Input () captionTitle:string;
  @Input () dialogType:string ='confirmDialog';

  submitAction () {
    this.actionToConfim.isConfirmed = true;
    this.dialogRefConfirm.close(this.actionToConfim);
  }
  cancelAction () {
    this.actionToConfim.isConfirmed = false;
    this.dialogRefConfirm.close(this.actionToConfim);
  }

}
