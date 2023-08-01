import { Injectable } from '@angular/core';
import { currencyRate, currencyRateList } from '../models/intefaces.model';
import { Observable, Subject } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CurrenciesDataService {
  constructor(private http : HttpClient) { }
  header = new HttpHeaders();
  currencyRatesList$ = new Subject();
  convertAmount (amount:string,base:string, quote:string, date: string) {
    this.getCurrencyRate(base,quote,date).subscribe(data => console.log('rate',data))
   }
   getCurrencyRate (base:string, quote:string, date: string):Observable<currencyRate> {
     const params = {base:base,quote:quote,date:date,dataType:'getCurrencyRate'}
     return this.http.get <currencyRate> ('api/AAM/getCurrencyData/',{params:params})
   }
   getCurrencyRatesList (searchParameters?:any):Observable<currencyRateList[]> {
    let params = {dataType:'getCurrencyRatesList'};
    (searchParameters !== null) ?  params = {...params,...searchParameters}: null;
     return this.http.get <currencyRateList[]> ('api/AAM/getCurrencyData/',{params:params})
   }
   getCurrencyPairsList ():Observable<currencyRateList[]> {
    let params = {dataType:'getPairsList'};
     return this.http.get <currencyRateList[]> ('api/AAM/getCurrencyData/',{params:params})
   }
   getCurrencyCodes (searchParameters?:any):Observable<currencyRateList[]> {
    let params = {dataType:'getCurrencyCodes'};
    (searchParameters !== null) ?  params = {...params,...searchParameters}: null;
     return this.http.get <currencyRateList[]> ('api/AAM/getCurrencyData/',{params:params})
   }
   sendReloadCurrencyRatesList () {
    this.currencyRatesList$.next(true);
   }
   getReloadCurrencyRatesList () {
    return this.currencyRatesList$.asObservable();
   }
   getCbrRateDaily(date:string) {
    this.http.get ('api/AAM/getCbrRateDaily/').subscribe()
   }
}
