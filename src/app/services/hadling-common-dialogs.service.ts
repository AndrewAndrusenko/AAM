import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';
import { AppConfimActionComponent } from '../components/common-forms/app-confim-action/app-confim-action.component';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root'
})
export class HadlingCommonDialogsService {
  dialogRefConfirm: MatDialogRef<AppConfimActionComponent>;
  verticalPosition: MatSnackBarVerticalPosition = 'bottom';
  constructor(
    private snack:MatSnackBar,
    private dialog: MatDialog, 
  ) {}
  dialogCloseAll () {this.dialog.closeAll()}
  confirmDialog (actionToConfim:string):Observable<any> {
    this.dialogRefConfirm = this.dialog.open(AppConfimActionComponent, {panelClass: 'custom-modalbox',} );
    this.dialogRefConfirm.componentInstance.actionToConfim = {'action':actionToConfim ,'isConfirmed': false}
    return this.dialogRefConfirm.afterClosed()
  }
  snackResultHandler (result :any, action?: string, postion:any = 'top', closeAll:boolean=true, duration:number=3000) {
    this.verticalPosition=postion;
    if (result['name']=='error') { 
      this.snack.open('Error: ' + result['detail'].split("\n", 1).join(""),'OK',{
        panelClass: ['snackbar-error'],
        verticalPosition: this.verticalPosition
      }); 
    } else {
      this.snack.open(action +': ' + result['detail'] ,'OK',{
        panelClass: ['snackbar-success'], 
        verticalPosition: this.verticalPosition, 
        duration: duration
      });
      closeAll? this.dialog.closeAll(): null;
    }
  }
}
