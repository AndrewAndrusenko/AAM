import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { marketData, moexMarketDataForiegnShres } from '../models/accounts-table-model';

@Injectable({
  providedIn: 'root'
})
export class AppMarketDataService {
  private httpOptions = {
    headers: new HttpHeaders({}),
    responseType: 'text'
  };
  constructor(private http:HttpClient) { }
  loadMarketDataExteranalSource (sourceCodes:string[],dateToLoad: string)  {
    console.log('source',sourceCodes);
    dateToLoad = dateToLoad
    let currentPosition = 0;
    let totalRows = 0;
    let pageSize = 100;  
    let params = {
      'date': null,
      'start':null,
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
          return console.log('total',  totalLoad)
        })
        })
      }
    })
  }
  insertMarketData (dataToInsert:any,sourceCode:string): Observable<number> {
    console.log('data',dataToInsert);
    return  this.http.post <number> ('/api/AAM/MD/importData/',{'dataToInsert': dataToInsert})
  }
  getMarketData ():Observable<marketData[]> {
    return this.http.get <marketData[]> ('/api/AAM/MD/getMarketData/')
  }
}


