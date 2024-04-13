import { AbstractControl,  AsyncValidatorFn,  FormGroup,  ValidationErrors,  } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { catchError, map, take, tap } from 'rxjs/operators';
import { AppInvestmentDataServiceService } from './investment-data.service.service';
import { AppAccountingService } from './accounting.service';
import { InstrumentDataService } from './instrument-data.service';
export class customAsyncValidators {

  static clientNameCustomAsyncValidator(userService: AppInvestmentDataServiceService, clientId: number, client:string='', errors?:ValidationErrors): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors> => {
      if (control.value.toUpperCase() !== client.toUpperCase() && (control.touched||control.dirty)) {
        return userService
        .getClientData(clientId, control.value, 'Check_clientname')
        .pipe(
          map (isTaken => (isTaken.length ? { uniqueClientName: true } : null)  ),
          catchError(() => of(null))
        );
      } else {return of(errors)}
    };
  }
  static secidCustomAsyncValidator (userService: AppInvestmentDataServiceService, secid:string): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors> => {
      return userService
        .getInstrumentData(control.value)
        .pipe(
          map (isTaken => (isTaken.length==0 ? { uniqueSecid: true } : null) ),
          catchError(() => of(null))
        );
    };
  }
  static strategyCodeCustomAsyncValidator (userService: AppInvestmentDataServiceService, Id:number, name: string, errors?:ValidationErrors): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors> => {
      if (control.value.toUpperCase() !== name.toUpperCase() && control.touched||control.dirty) {
        return userService
          .getGlobalStategiesList (Id, control.value, 'Check_Name')
          .pipe(
            map ( isTaken => ( control.touched && control.value !== Id && isTaken.length ? { uniqueStrategyCode: true } : null)  ),
            catchError(() => of(null))
          )
      } else {return of(errors)}
    };
  }
  static AccountingAccountNoAValidator (AccountingDataService: AppAccountingService, AccountNo:string, accountId:AbstractControl, validationsToSkip: string[]): AsyncValidatorFn {
    let  controlErrors:ValidationErrors;
    return (control: AbstractControl): Observable<ValidationErrors> => {
      if (!validationsToSkip.includes('AccountingAccountNoAValidator')) {
        return AccountingDataService
          .GetAccountData (null,null,null, control.value, 'GetAccountData','AccountAccountNo Validator')
          .pipe(
            tap( () => control.markAsPending()),
            tap (data => data.length && (data[0].accountId!==accountId.value) ? accountId.setValue (data[0].accountId) : null),
            tap (accountExist => (controlErrors = control.touched && !accountExist.length ? { accountIsNotExist: true } : null)  ),
            map (accountExist => (control.touched && !accountExist.length ? { accountIsNotExist: true } : null)  ),
            catchError(() => of(controlErrors)),
            take(1),
          );
      } else {
        validationsToSkip.splice(validationsToSkip.indexOf('AccountingAccountNoAValidator'),1)
        return of(controlErrors);
      }
    };
  }
  static LedgerAccountNoAValidator (AccountingDataService: AppAccountingService, AccountNo:string,ledgerId:AbstractControl, validationsToSkip: string[]): AsyncValidatorFn {
    let  controlErrors:ValidationErrors;
    return (control: AbstractControl): Observable<ValidationErrors| null> => {
      if (!validationsToSkip.includes('LedgerAccountNoAValidator')) {
        return AccountingDataService
          .GetLedgerData (null,null,null, control.value, 'GetLedgerData','LedgerAccountNo Validator')
          .pipe(
            tap(() => control.markAsPending()),
            tap (data => data.length && (data[0].ledgerNoId!==ledgerId.value) ? ledgerId.setValue (data[0].ledgerNoId) : null),
            tap (accountExist => (controlErrors = control.touched && !accountExist.length ? { accountIsNotExist: true } : null)  ),
            map (accountExist => (control.touched && !accountExist.length ? { accountIsNotExist: true } : null)  ),
            catchError(() => of(controlErrors)),
            take(1),
          );
      } else {
        validationsToSkip.splice(validationsToSkip.indexOf('LedgerAccountNoAValidator'),1)
        return of(controlErrors);
      }
    };
  }
  static AccountingUniqueAccountNoAsyncValidator (AccountingDataService: AppAccountingService, AccountNo:string): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors| null> => {
      return AccountingDataService
        .GetAccountData (null,null,null, control.value, 'GetAccountData')
        .pipe(
          take(1),
          map ( accountIsTaken => (control.value !== AccountNo && accountIsTaken.length ? { accountIsTaken: true } : null)  ),
          catchError(() => of(null)),
        );
    };
  }

  static AccountingUniqueLedgerNoAsyncValidator (AccountingDataService: AppAccountingService, AccountNo:string): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors> => {
      return AccountingDataService
        .GetLedgerData (null,null,null, control.value, 'GetLedgerData')
        .pipe(
          take(1),
          map ( accountIsTaken => (control.value !== AccountNo && accountIsTaken.length ? { accountIsTaken: true } : null)  ),
          catchError(() => of(null)),
        );
    };
  }
  static AccountingOverdraftAccountAsyncValidator (AccountingDataService: AppAccountingService, AccountId:AbstractControl, transactionAmount: AbstractControl, transactionDate:AbstractControl, xactTypeCode:AbstractControl, d_closingBalance: AbstractControl, id: AbstractControl, FirstOpenedAccountingDate : Date): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors> => {
        return AccountingDataService
          .getExpectedBalanceOverdraftCheck (AccountId.value,transactionAmount.getRawValue(), new Date (transactionDate.value).toDateString(),xactTypeCode.value, id.value, new Date (FirstOpenedAccountingDate).toDateString(),'AccountingOverdraftAccountCheck')
          .pipe(
            tap (expectedBalance => d_closingBalance.setValue (expectedBalance[0].closingBalance)),
            map (expectedBalance => (expectedBalance[0].closingBalance < 0 ? {overdraft: true} : null)),
            catchError(() => of(null)),
            take(1),
          );
    };
  }
  static AccountingOverdraftLedgerAccountAsyncValidator (AccountingDataService: AppAccountingService, AccountId:AbstractControl, transactionAmount: AbstractControl, transactionDate:AbstractControl, xactTypeCode:AbstractControl|number, d_closingBalance: AbstractControl, id: AbstractControl, FirstOpenedAccountingDate : Date, FG:FormGroup): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors| null> => {
        return AccountingDataService
        .getExpectedBalanceLedgerOverdraftCheck (AccountId.value,transactionAmount.getRawValue(), new Date (transactionDate.value).toDateString(), typeof(xactTypeCode)==='number'? xactTypeCode: xactTypeCode.value, id.value, new Date (FirstOpenedAccountingDate).toDateString(), 'AccountingOverdraftAccountCheck')
        .pipe(
          tap (expectedBalance => d_closingBalance.setValue (expectedBalance[0].closingBalance)),
          map (expectedBalance => (expectedBalance[0].closingBalance < 0 ? {overdraft: true} : null)),
          catchError(() => of( {overdraft: true})),
          take(1),
        );
    }
  }  
  static MD_SecidUniqueAsyncValidator (InstrumentDataS: InstrumentDataService, secid:string,  errors?:ValidationErrors): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors> => {
    if (control.value.toUpperCase() !== secid.toUpperCase() && (control.touched||control.dirty)) {
        return InstrumentDataS
          .getInstrumentDataGeneral('validateSecidForUnique', control.value.toUpperCase())
          .pipe(
            map (secidIsTaken => (secidIsTaken as {secid:string}[]).length? {secidIsTaken: true} : null),
            catchError(() => of(null))
          );
      } else {return of(errors)}
    };
  }
  static MD_ISINuniqueAsyncValidator (InstrumentDataS: InstrumentDataService, isin:string, errors?:ValidationErrors): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (control.value.toUpperCase() !== isin.toUpperCase() && (control.touched||control.dirty)) {
        return InstrumentDataS
          .getInstrumentDataGeneral('validateISINForUnique', control.value.toUpperCase())
          .pipe(
            map (isinIsTaken  => (isinIsTaken as {isin:string}[]).length? {isinIsTaken: true} : null),
            catchError(() => of(null)),
          );
      } else {return of(errors)}
    };
  }
}