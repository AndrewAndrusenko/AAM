import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppConfimActionComponent } from '../components/alerts/app-confim-action/app-confim-action.component';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root'
})
export class HadlingCommonDialogsService {
  dialogRefConfirm: MatDialogRef<AppConfimActionComponent>;

  constructor(
    private snack:MatSnackBar,
    private dialog: MatDialog, 
  ) { 
    
  }
  confirmDialog (actionToConfim:string):Observable<any> {
    this.dialogRefConfirm = this.dialog.open(AppConfimActionComponent, {panelClass: 'custom-modalbox',} );
    this.dialogRefConfirm.componentInstance.actionToConfim = {'action':actionToConfim ,'isConfirmed': false}
    return this.dialogRefConfirm.afterClosed()
    }
  snackResultHandler (result :any, action: string, dataForUpdateLog?:any) {
    if (result['name']=='error') {
      this.snack.open('Error: ' + result['detail'].split("\n", 1).join(""),'OK',{panelClass: ['snackbar-error']}); 
    } else {
      this.snack.open(action +': ' + result + ' entry','OK',{panelClass: ['snackbar-success'], duration: 3000});
      this.dialog.closeAll();
    }
  }
}
