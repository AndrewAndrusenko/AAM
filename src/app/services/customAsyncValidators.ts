import {
  AbstractControl,
  AsyncValidatorFn,
  ValidationErrors,
} from '@angular/forms';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AppInvestmentDataServiceService } from './app-investment-data.service.service';
import { AppTabServiceService } from './app-tab-service.service';

export class customAsyncValidators {
  static clientNameCustomAsyncValidator(userService: AppTabServiceService, clientId:number): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors> => {
      return userService
        .getClientData(clientId, control.value, 'Check_clientname')
        .pipe(
          map ( isTaken => ( control.touched && control.value !== clientId && isTaken.length ? { uniqueClientName: true } : null)  ),
          catchError(() => of(null))
        );
    };
  }
  static secidCustomAsyncValidator (userService: AppTabServiceService, secid:string): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors> => {
      console.log('ID', secid , control.value, 'Check_secid');
      return userService
        .getInstrumentData(control.value)
        .pipe(
          map (isTaken => (isTaken.length==0 ? { uniqueSecid: true } : null) ),
          catchError(() => of(null))
        );
    };
  }
  
  static strategyCodeCustomAsyncValidator (userService: AppInvestmentDataServiceService, Id:number): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors> => {
      return userService
        .getGlobalStategiesList (Id, control.value, 'Check_Name')
        .pipe(
          map ( isTaken => ( control.touched && control.value !== Id && isTaken.length ? { uniqueStrategyCode: true } : null)  ),
          catchError(() => of(null))
        );
    };
  }
}