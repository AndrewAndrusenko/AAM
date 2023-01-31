import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-app-confim-action',
  templateUrl: './app-confim-action.component.html',
  styleUrls: ['./app-confim-action.component.css']
})
export class AppConfimActionComponent {
  constructor(private dialog: MatDialog) {
    
  }
  public action: string;
  @Input()  secid : string;

  CancelAction () {
    this.dialog.closeAll();
  }

  updateClientData (action) {}

}
