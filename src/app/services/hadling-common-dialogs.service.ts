import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';
import { AppConfimActionComponent } from '../components/common-forms/app-confim-action/app-confim-action.component';
import { Observable } from 'rxjs/internal/Observable';
import { dbErrorsMap } from '../models/errorsDescriptions';

@Injectable({
  providedIn: 'root'
})
export class HadlingCommonDialogsService {
  dialogRefConfirm: MatDialogRef<AppConfimActionComponent>;
  verticalPosition: MatSnackBarVerticalPosition = 'bottom';
  dbErrorsMap = dbErrorsMap;
  constructor(
    private snack:MatSnackBar,
    private dialog: MatDialog, 
  ) {}
  dialogCloseAll () {this.dialog.closeAll()}
  confirmDialog (actionToConfim:string, buttonToConfirm?:string):Observable<{action:string ,
    isConfirmed: boolean, 
    buttonLabel:string}> {
    this.dialogRefConfirm = this.dialog.open(AppConfimActionComponent, {panelClass: 'custom-modalbox',minHeight:'10vh', maxHeight: '70vh', minWidth:'40wv',maxWidth:'70wv', } );
    this.dialogRefConfirm.componentInstance.actionToConfim = {
      action:actionToConfim ,
      isConfirmed: false, 
      buttonLabel:buttonToConfirm||actionToConfim}
    return this.dialogRefConfirm.afterClosed()
  }
  jsonDataDialog (jsonData:{},captionTitle:string='') {
    this.dialogRefConfirm = this.dialog.open(AppConfimActionComponent, {panelClass: 'custom-modalbox',} );
    this.dialogRefConfirm.componentInstance.actionToConfim = {'action':'' ,'isConfirmed': false}
    
    this.dialogRefConfirm.componentInstance.dialogType = 'jsonData'
    this.dialogRefConfirm.componentInstance.jsonData = jsonData;
    this.dialogRefConfirm.componentInstance.captionTitle = captionTitle;
  }
  snackResultHandler (result :{name:string,detail:string}|Array<{}>|number, action?: string, postion:MatSnackBarVerticalPosition = 'top', closeAll:boolean=true, duration:number=3000,err=true) {
    this.verticalPosition=postion;
    if (result['name']=='error') { 
      this.dbErrorsMap.forEach (el => result['detail'].includes(el.constraintCode)? result['detail'] = el.errorText : null);
      this.snack.open(err? 'Error: '+ result['detail']:'' + result['detail'],'OK',{
        panelClass: ['snackbar-error'],
        verticalPosition: this.verticalPosition
      }); 
    } else {
      this.snack.open(result['detail']? action +': ' + result['detail'] : action ,'OK',{
        panelClass: ['snackbar-success'], 
        verticalPosition: this.verticalPosition, 
        duration: duration
      });
      closeAll? this.dialog.closeAll(): null;
    }
  }
}
