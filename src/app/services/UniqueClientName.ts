import {
  AbstractControl,
  AsyncValidatorFn,
  ValidationErrors,
} from '@angular/forms';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
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