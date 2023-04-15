import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { marketData, marketDataSources, marketSourceSegements, moexMarketDataForiegnShres } from '../models/accounts-table-model';

@Injectable({
  providedIn: 'root'
})
export class AppMarketDataService {
  private httpOptions = {
    headers: new HttpHeaders({}),
    responseType: 'text'
  };
  constructor(private http:HttpClient) { }
  loadMarketDataExteranalSource (sourceCodes:marketSourceSegements[],dateToLoad: string): any[]  {
    let logMarketDateLoading = []
    sourceCodes.forEach(source => {
      console.log('source',source);
      let currentPosition = 0;
      let totalRows = 0;
      let pageSize = 100;  
      let params = source.params
      params['date'] = dateToLoad;
      console.log('dateToLoad',dateToLoad);

      params['start'] = 0
   /*    {
        'date': null,
        'start':null,
        'iss.json': 'extended',
        'iss.meta': 'off',
        'history.columns':'BOARDID, TRADEDATE,SECID, VALUE, OPEN, LOW, HIGH, LEGALCLOSEPRICE, WAPRICE, CLOSE,'+
        'VOLUME, MARKETPRICE2, MARKETPRICE3, ADMITTEDQUOTE, MP2VALTRD, MARKETPRICE3TRADESVALUE,'+
        'ADMITTEDVALUE, WAVAL, TRADINGSESSION,  NUMTRADES'
      }
 */
      let totalLoad = 0;
      return this.http.get (source.sourceURL, {params:params} ).subscribe (marketData => {
        currentPosition = marketData[1]['history.cursor'][0]['INDEX'];
        pageSize = marketData[1]['history.cursor'][0]['PAGESIZE'];
        totalRows = marketData[1]['history.cursor'][0]['TOTAL'];
        for (let index = 0; index <= totalRows; index=index + pageSize) {
          params['start'] = index;
          console.log('index', params);
          this.http.get (source.sourceURL, {params:params} ).subscribe (marketData => {
          return this.insertMarketData (marketData[1]['history'],source.sourceCode,'MOEXiss').subscribe((rowLoaded) =>{
            totalLoad=totalLoad+rowLoaded
            totalLoad>=totalRows? logMarketDateLoading.push ({
              'Source':'MOEXiss - '+ source.sourceCode,
              'Total rows loaded - ' : totalLoad,
              'Total rows fetched from source - ': totalRows,
              'Date': dateToLoad}):null;
            console.log('log',  logMarketDateLoading)
            return logMarketDateLoading
          })
          })
        }
      })
    });
    return logMarketDateLoading;
  }
  insertMarketData (dataToInsert:any,sourceCode:string, gloabalSource:string): Observable<number> {
    console.log('data',dataToInsert);
    return  this.http.post <number> ('/api/AAM/MD/importData/',
    {'dataToInsert': dataToInsert,'sourceCode':sourceCode, 'gloabalSource':gloabalSource})
  }
  getMarketData ():Observable<marketData[]> {
    return this.http.get <marketData[]> ('/api/AAM/MD/getMarketData/')
  }
  getMarketDataSources ():Observable<marketDataSources[]> {
    return this.http.get <marketDataSources[]> ('/api/AAM/MD/getMarketDataSources/')
  }
}


