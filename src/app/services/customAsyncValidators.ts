import { AbstractControl,  AsyncValidatorFn,  FormGroup,  ValidationErrors,  } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { catchError, map, take, tap } from 'rxjs/operators';
import { AppInvestmentDataServiceService } from './app-investment-data.service.service';
import { AppAccountingService } from './app-accounting.service';
import { AppMarketDataService } from './app-market-data.service';
export class customAsyncValidators {
  static clientNameCustomAsyncValidator(userService: AppInvestmentDataServiceService, clientId: number, client:string, errors?:ValidationErrors): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors> => {
      if (control.value.toUpperCase() !== client.toUpperCase() && control.touched||control.dirty) {
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
      console.log('ID', secid , control.value, 'Check_secid');
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
  static AccountingAccountNoCustomAsyncValidator (AccountingDataService: AppAccountingService, AccountNo:string, accountId:AbstractControl, FG: FormGroup): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors> => {
      return AccountingDataService
        .GetAccountData (null,null,null, control.value, 'GetAccountData')
        .pipe(
          tap (data => data.length && (data[0].accountId!==accountId.value) ? accountId.setValue (data[0].accountId) : null),
          map (accountExist => (control.touched && !accountExist.length ? { accountIsNotExist: true } : null)  ),
          catchError(() => of(null)),
          take(1)
        );
    };
  }
  static LedgerAccountNoCustomAsyncValidator (AccountingDataService: AppAccountingService, AccountNo:string,ledgerId:AbstractControl): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors> => {
      return AccountingDataService
        .GetLedgerData (null,null,null, control.value, 'GetLedgerData')
        .pipe(
          tap (data => data.length && (data[0].ledgerNoId!==ledgerId.value) ? ledgerId.setValue (data[0].ledgerNoId) : null),
          map (accountExist => (control.touched && !accountExist.length ? { accountIsNotExist: true } : null)  ),
          catchError(() => of(null)),
          take(1)
        );
    };
  }
  static AccountingUniqueAccountNoAsyncValidator (AccountingDataService: AppAccountingService, AccountNo:string): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors> => {
      return AccountingDataService
        .GetAccountData (null,null,null, control.value, 'GetAccountData')
        .pipe(
          map ( accountIsTaken => (control.value !== AccountNo && accountIsTaken.length ? { accountIsTaken: true } : null)  ),
          catchError(() => of(null)),
          take(1)
        );
    };
  }

  static AccountingUniqueLedgerNoAsyncValidator (AccountingDataService: AppAccountingService, AccountNo:string): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors> => {
      return AccountingDataService
        .GetLedgerData (null,null,null, control.value, 'GetLedgerData')
        .pipe(
          map ( accountIsTaken => (control.value !== AccountNo && accountIsTaken.length ? { accountIsTaken: true } : null)  ),
          catchError(() => of(null)),
          take(1)
        );
    };
  }
  static AccountingOverdraftAccountAsyncValidator (
  AccountingDataService: AppAccountingService, AccountId:AbstractControl, transactionAmount: AbstractControl, transactionDate:AbstractControl, xactTypeCode:AbstractControl, d_closingBalance: AbstractControl, id: AbstractControl, FirstOpenedAccountingDate : Date, FG1:FormGroup  
  ): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors> => {
      if (FG1.status!=='VALID'&&transactionAmount.value!==null&&transactionDate.value!==null) {  
        return AccountingDataService
          .getExpectedBalanceOverdraftCheck (AccountId.value,transactionAmount.getRawValue(), new Date (transactionDate.value).toDateString(),xactTypeCode.value, id.value, new Date (FirstOpenedAccountingDate).toDateString(),'AccountingOverdraftAccountCheck')
          .pipe(
            tap (expectedBalance => d_closingBalance.setValue (expectedBalance[0].closingBalance)),
            map (expectedBalance => (expectedBalance[0].closingBalance < 0 ? {overdraft: true} : null)),
            catchError(() => of(null)),
            take(1)
          );
      } else {return of(null)};
    };
  }
  static AccountingOverdraftLedgerAccountAsyncValidator (AccountingDataService: AppAccountingService, AccountId:AbstractControl, transactionAmount: AbstractControl, transactionDate:AbstractControl, xactTypeCode:number, d_closingBalance: AbstractControl, id: AbstractControl, FirstOpenedAccountingDate : Date, FG:FormGroup): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors| null> => {
      if (FG.status!=='VALID'&&transactionAmount.value!==null&&transactionDate.value!==null) {  
        return AccountingDataService
        .getExpectedBalanceLedgerOverdraftCheck (AccountId.value,transactionAmount.getRawValue(), new Date (transactionDate.value).toDateString(), xactTypeCode, id.value, new Date (FirstOpenedAccountingDate).toDateString(), 'AccountingOverdraftAccountCheck')
        .pipe(
          tap (expectedBalance => d_closingBalance.setValue (expectedBalance[0].closingBalance)),
          map (expectedBalance => (expectedBalance[0].closingBalance < 0 ? {overdraft: true} : null)),
          catchError(() => of(null)),
        );
      } else {return of(null)};
    }
  }  
  static MD_SecidUniqueAsyncValidator (AppMarketDataService: AppMarketDataService, secid:string,  errors?:ValidationErrors): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors> => {
      if (control.value.toUpperCase() !== secid.toUpperCase() && control.touched||control.dirty) {
        return AppMarketDataService
          .getInstrumentDataGeneral('validateSecidForUnique', control.value.toUpperCase())
          .pipe(
            map (secidIsTaken => secidIsTaken.length? {secidIsTaken: true} : null),
            catchError(() => of(null))
          );
      } else {return of(errors)}
    };
  }
  static MD_ISINuniqueAsyncValidator (AppMarketDataService: AppMarketDataService, isin:string, errors?:ValidationErrors): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (control.value.toUpperCase() !== isin.toUpperCase() && (control.touched||control.dirty)) {
        return AppMarketDataService
          .getInstrumentDataGeneral('validateISINForUnique', control.value.toUpperCase())
          .pipe(
            map (isinIsTaken => isinIsTaken.length? {isinIsTaken: true} : null),
            catchError(() => of(null)),
          );
      } else {return of(errors)}
    };
  }
}