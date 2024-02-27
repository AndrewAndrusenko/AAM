import { Injectable } from '@angular/core';
import { currencyRate, currencyRateList, marketSourceSegements } from '../models/interfaces.model';
import { EMPTY, Observable, catchError, filter, map, of, switchMap, tap } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { HadlingCommonDialogsService } from './hadling-common-dialogs.service';
interface  CurrenciessearchParameters {
  pairsList? : string[],
  dateRangeStart?:string,
  dateRangeEnd?:string,
  sourcecode? : string[],
}
@Injectable({
  providedIn: 'root'
})
export class CurrenciesDataService {
  constructor(
    private http : HttpClient,
    private commonDialogsService:HadlingCommonDialogsService
    ) { }
  header = new HttpHeaders();
   getCurrencyRate (base:string, quote:string, date: string):Observable<currencyRate[]> {
     const params = {base:base,quote:quote,date:date,dataType:'getCurrencyRate'}
     return this.http.get <currencyRate[]> ('api/AAM/getCurrencyData/',{params:params})
   }
   getCurrencyCrossRate (base:string, quote:string, date: string,cross:string):Observable<currencyRate[]> {
     const params = {base:base,quote:quote,date:date,dataType:'getCurrencyCrossRate',cross:cross}
     return this.http.get <currencyRate[]> ('api/AAM/getCurrencyData/',{params:params})
   }
   getCurrencyRatesList (searchParameters?:CurrenciessearchParameters):Observable<currencyRateList[]> {
    let params = {dataType:'getCurrencyRatesList'};
    (searchParameters !== null) ?  params = {...params,...searchParameters}: null;
     return this.http.get <currencyRateList[]> ('api/AAM/getCurrencyData/',{params:params})
   }
   getCurrencyPairsList ():Observable<currencyRateList[]> {
    let params = {dataType:'getPairsList'};
     return this.http.get <currencyRateList[]> ('api/AAM/getCurrencyData/',{params:params})
   }
   getCurrencyCodes (searchParameters?:CurrenciessearchParameters):Observable<currencyRateList[]> {
    let params = {dataType:'getCurrencyCodes'};
    (searchParameters !== null) ?  params = {...params,...searchParameters}: null;
     return this.http.get <currencyRateList[]> ('api/AAM/getCurrencyData/',{params:params})
   }
   checkLoadedRatesData (sourceCodesArray:string[], date:string):Observable<number[]>{
    let params = {dataType:'checkLoadedRatesData',date:date, sourcecode:sourceCodesArray};
    return this.http.get <number[]> ('api/AAM/getCurrencyData/',{params:params})
   }
   deleteOldRateData (sourceCodesArray:string[], date:string):Observable<currencyRateList[]>{
    let params = {dataType:'deleteOldRateData',date:date, sourcecode:sourceCodesArray};
    return this.http.post <currencyRateList[]> ('api/AAM/modifyRatesData/',{params:params})
   }
   
   getCbrRateDaily(sourceCodes:marketSourceSegements[],date:string, dataType:string):Observable<currencyRateList[]> {
    let params = {date:date,dataType:dataType};
    return this.http.get <currencyRateList[]> ('api/AAM/getCbrRateDaily/',{params:params});
   }
   getRatestData(dateToLoad:string,sourcesData: marketSourceSegements[],overwritingData:boolean,dateToDelete:string='')
   :Observable<{message:string,state:string,deletedCount:number,loadedCount:number, data:currencyRateList[]}> {
    let loadingDataState = {message:'Loading',state:'allowed',deletedCount:0,loadedCount:0}
    let sourceCodesArray:string[] = sourcesData.map(el=>{return el.sourceCode})
    return this.getCbrRateDaily(sourcesData, dateToLoad,'getRatesDate').pipe(
      switchMap(ratesDate=>this.checkLoadedRatesData (sourceCodesArray,dateToDelete = ratesDate['dateToCheck'].toString())),
      tap(lastDate=>lastDate.length>0&&!overwritingData? loadingDataState={message:'Loading terminated. Data have been already loaded!', state : 'terminated',deletedCount:0,loadedCount:0}:null),
      switchMap(lastDate=>lastDate.length>0&&overwritingData? this.commonDialogsService.confirmDialog('Delete all rates for the date '+ dateToLoad+ ' and codes ' + sourceCodesArray):of({isConfirmed:null})),
      tap(result=>result.isConfirmed===false? loadingDataState = {message:'Loading has been canceled', state : 'terminated',deletedCount:0,loadedCount:0}:null),
      switchMap(result=>result.isConfirmed? this.deleteOldRateData(sourceCodesArray,dateToDelete):of(null)),
      tap(rowsDeleted=>rowsDeleted? loadingDataState.deletedCount = rowsDeleted.length:null),
      switchMap(()=>loadingDataState.state==='allowed'? this.getCbrRateDaily(sourcesData, dateToLoad,undefined) : of(null)),
      tap(data=>data? loadingDataState.loadedCount = data.length:null),
      switchMap(loadedData=>of({...loadingDataState,data:loadedData})),
     ) as Observable<{message:string,state:string,deletedCount:number,loadedCount:number, data:currencyRateList[]}>
  }
}