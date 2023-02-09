import {
  AbstractControl,
  AsyncValidatorFn,
  ValidationErrors,
} from '@angular/forms';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AppInvestmentDataServiceService } from './app-investment-data.service.service';
import { AppTabServiceService } from './app-tab-service.service';

export class UsernameValidator {
  static createValidator(userService: AppTabServiceService, clientId:number): AsyncValidatorFn {

    return (control: AbstractControl): Observable<ValidationErrors> => {
      console.log('ID',clientId , control.value, 'Check_clientname');
      return userService
        .getClientData(clientId, control.value, 'Check_clientname')
        .pipe(
          
          map ( isTaken => ( control.touched && control.value !== clientId && isTaken.length ? { uniqueAlterEgo: true } : null)  ),
          catchError(() => of(null))
        );
    };
  }
  
}

export class StrategynameValidator {
  static createValidator(userService: AppInvestmentDataServiceService, Id:number): AsyncValidatorFn {

    return (control: AbstractControl): Observable<ValidationErrors> => {
      console.log('ID',Id , control.value, 'Check_Name');
      return userService
        .getGlobalStategiesList (Id, control.value, 'Check_Name')
        .pipe(
          map ( isTaken => ( control.touched && control.value !== Id && isTaken.length ? { uniqueAlterEgo: true } : null)  ),
          catchError(() => of(null))
        );
    };
  }
  
}