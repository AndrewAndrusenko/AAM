import { Component } from '@angular/core';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';

@Component({
  selector: 'app-app-snack-msgbox',
  templateUrl: './app-snack-msgbox.component.html',
  styleUrls: ['./app-snack-msgbox.component.css']
})
export class AppSnackMsgboxComponent {
  constructor(private _snackBar: MatSnackBar) {}

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action);
  }
}
