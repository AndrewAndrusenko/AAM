import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { moexMarketDataForiegnShres } from '../models/accounts-table-model';

@Injectable({
  providedIn: 'root'
})
export class AppMarketDataService {
  private httpOptions = {
    headers: new HttpHeaders({}),
    responseType: 'text'
  };
  constructor(private http:HttpClient) { }
  getMarketData (sourceCodes:string[],dateToLoad: string)  {
    dateToLoad = dateToLoad
    let currentPosition = 0;
    let totalRows = 0;
    let pageSize = 100;  
    let params = {
      'date': dateToLoad,
      'start':currentPosition,
      'iss.json': 'extended',
      'iss.meta': 'off',
      'history.columns':'BOARDID, TRADEDATE,SECID, VALUE, OPEN, LOW, HIGH, LEGALCLOSEPRICE, WAPRICE, CLOSE,'+
      'VOLUME, MARKETPRICE2, MARKETPRICE3, ADMITTEDQUOTE, MP2VALTRD, MARKETPRICE3TRADESVALUE,'+
      'ADMITTEDVALUE, WAVAL, TRADINGSESSION,  NUMTRADES'
    }

    let totalLoad = 0;
    return this.http.get ('https://iss.moex.com/iss/history/engines/stock/markets/foreignshares/securities.json', {params:params} ).subscribe (marketData => {
      currentPosition = marketData[1]['history.cursor'][0]['INDEX'];
      pageSize = marketData[1]['history.cursor'][0]['PAGESIZE'];
      totalRows = marketData[1]['history.cursor'][0]['TOTAL'];
      for (let index = 0; index <= totalRows; index=index + pageSize) {
        params.start = index;
        console.log('index', index);
        this.http.get ('https://iss.moex.com/iss/history/engines/stock/markets/foreignshares/securities.json', {params:params} ).subscribe (marketData => {
         return this.insertMarketData (marketData[1]['history'],'aa').subscribe((rowLoaded) =>{
          totalLoad=totalLoad+rowLoaded
          return totalLoad})
        })
      }
      
    })
  }
  insertMarketData (dataToInsert:any,sourceCode:string): Observable<number> {
    console.log('data',dataToInsert);
    return  this.http.post <number> ('/api/AAM/MD/importData/',{'dataToInsert': dataToInsert})
  }
}
/* this.http.get ('https://iss.moex.com/iss/history/engines/stock/markets/foreignshares/securities.json?date=2022-01-21&start=500&iss.json=extended&iss.meta=off' */


