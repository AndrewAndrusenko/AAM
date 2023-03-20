import {
  AbstractControl,
  AsyncValidatorFn,
  ValidationErrors,
} from '@angular/forms';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { AppInvestmentDataServiceService } from './app-investment-data.service.service';
import { AppTabServiceService } from './app-tab-service.service';
import { AppAccountingService } from './app-accounting.service';
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

  static AccountingAccountNoCustomAsyncValidator (AccountingDataService: AppAccountingService, AccountNo:string): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors> => {
      return AccountingDataService
        .GetAccountData (null,null,null, control.value, 'GetAccountData')
        .pipe(
          map ( accountExist => (control.touched && !accountExist.length ? { accountIsNotExist: true } : null)  ),
          catchError(() => of(null))
        );
    };
  }
  static AccountingUniqueAccountNoAsyncValidator (AccountingDataService: AppAccountingService, AccountNo:string): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors> => {
      return AccountingDataService
        .GetAccountData (null,null,null, control.value, 'GetAccountData')
        .pipe(
          map ( accountIsTaken => (control.value !== AccountNo && accountIsTaken.length ? { accountIsTaken: true } : null)  ),
          catchError(() => of(null))
        );
    };
  }
  static LedgerAccountNoCustomAsyncValidator (AccountingDataService: AppAccountingService, AccountNo:string): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors> => {
      return AccountingDataService
        .GetLedgerData (null,null,null, control.value, 'GetLedgerData')
        .pipe(
          map ( accountExist => (control.touched && !accountExist.length ? { accountIsNotExist: true } : null)  ),
          catchError(() => of(null))
        );
    };
  }
  static AccountingUniqueLedgerNoAsyncValidator (AccountingDataService: AppAccountingService, AccountNo:string): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors> => {
      return AccountingDataService
        .GetLedgerData (null,null,null, control.value, 'GetLedgerData')
        .pipe(
          map ( accountIsTaken => (control.value !== AccountNo && accountIsTaken.length ? { accountIsTaken: true } : null)  ),
          catchError(() => of(null))
        );
    };
  }
  static AccountingOverdraftAccountAsyncValidator (
    AccountingDataService: AppAccountingService, AccountId:AbstractControl, transactionAmount: AbstractControl, transactionDate:AbstractControl, xactTypeCode:AbstractControl, d_closingBalance: AbstractControl, id: AbstractControl, FirstOpenedAccountingDate : Date  
    ): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors> => {
      return AccountingDataService
        .getExpectedBalanceOverdraftCheck (AccountId.value,transactionAmount.getRawValue(), new Date (transactionDate.value).toDateString(),xactTypeCode.value, id.value, new Date (FirstOpenedAccountingDate).toDateString(),'AccountingOverdraftAccountCheck')
        .pipe(
          tap (expectedBalance => d_closingBalance.setValue (expectedBalance[0].closingBalance ) ),
          map ( expectedBalance => (expectedBalance[0].closingBalance < 0 ? { overdraft: true } : null)  ),
          catchError(() => of(null))
          );
    };
  }
  static AccountingOverdraftLedgerAccountAsyncValidator (
    AccountingDataService: AppAccountingService, AccountId:AbstractControl, transactionAmount: AbstractControl, transactionDate:AbstractControl, xactTypeCode:number, d_closingLedgerBalance: AbstractControl, id: AbstractControl, FirstOpenedAccountingDate : Date 
    ): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors> => {
      return AccountingDataService
        .getExpectedBalanceLedgerOverdraftCheck (AccountId.value,transactionAmount.getRawValue(), new Date (transactionDate.value).toDateString(), xactTypeCode, id.value, new Date (FirstOpenedAccountingDate).toDateString(), 'AccountingOverdraftAccountCheck')
        .pipe(
          // tap (expectedBalance => console.log('ad', getControlName(AccountId)) ),
          tap (expectedBalance => d_closingLedgerBalance.setValue (expectedBalance[0].closingBalance ) ),
          map ( expectedBalance => (expectedBalance[0].closingBalance < 0 ? { overdraft: true } : null)  ),
          catchError(() => of(null))
          );
    };
  }  
}
function getControlName(c: AbstractControl): string | null {
  const formGroup = c.parent.controls;
  return Object.keys(formGroup).find(name => c === formGroup[name]) || null;
}
