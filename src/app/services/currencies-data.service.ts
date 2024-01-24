import { Injectable } from '@angular/core';
import { currencyRate, currencyRateList, marketSourceSegements } from '../models/interfaces.model';
import { Observable, Subject } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CurrenciesDataService {
  constructor(private http : HttpClient) { }
  header = new HttpHeaders();
  // currencyRatesList$ = new Subject<currencyRateList[]>();
  convertAmount (amount:string,base:string, quote:string, date: string) {
    this.getCurrencyRate(base,quote,date).subscribe(data => console.log('rate',data))
   }
   getCurrencyRate (base:string, quote:string, date: string):Observable<currencyRate[]> {
     const params = {base:base,quote:quote,date:date,dataType:'getCurrencyRate'}
     return this.http.get <currencyRate[]> ('api/AAM/getCurrencyData/',{params:params})
   }
   getCurrencyCrossRate (base:string, quote:string, date: string,cross:string):Observable<currencyRate[]> {
     const params = {base:base,quote:quote,date:date,dataType:'getCurrencyCrossRate',cross:cross}
     return this.http.get <currencyRate[]> ('api/AAM/getCurrencyData/',{params:params})
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
   checkLoadedRatesData (sourceCodesArray:string[], date:string):Observable<any>{
    let params = {dataType:'checkLoadedRatesData',date:date, sourcecode:sourceCodesArray};
    return this.http.get <any[]> ('api/AAM/getCurrencyData/',{params:params})
   }
   deleteOldRateData (sourceCodesArray:string[], date:string):Observable<any>{
    let params = {dataType:'deleteOldRateData',date:date, sourcecode:sourceCodesArray};
    return this.http.post <any[]> ('api/AAM/modifyRatesData/',{params:params})
   }
   
   getCbrRateDaily(sourceCodes:marketSourceSegements[],date:string, dataType:string):Observable<any> {
    let params = {date:date,dataType:dataType};
    return this.http.get <any[]> ('api/AAM/getCbrRateDaily/',{params:params});
   }
}