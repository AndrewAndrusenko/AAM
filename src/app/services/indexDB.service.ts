import { Injectable } from '@angular/core';
import { AppMarketDataService } from './app-market-data.service';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { AppAccountingService } from './app-accounting.service';
interface cacheAAM {
  code:string,
  data:[]
}
@Injectable({
  providedIn: 'root'
})
export class indexDBService {
  constructor(
    private MarketDataService: AppMarketDataService,
    private dbService: NgxIndexedDBService,
    private AccountingDataService:AppAccountingService, 
  ) { }
  indexDBcacheData (key:string,data:any) {
    // console.log('data',data[0]);
    this.dbService
    .add('AAMCache', {code:key, data:data})
    .subscribe((result) => {
      console.log('result: ', result);
    });
  }
  async fetchDataFromDb (key:string) {
    return new Promise ((resolve,reject)=> {
      switch (key) {
        case 'getBoardsDataFromInstruments':
          this.MarketDataService.getInstrumentDataGeneral('getBoardsDataFromInstruments').subscribe(data=>resolve(data))
        break;
        case 'getInstrumentDataDetails':
          this.MarketDataService.getInstrumentDataDetails().subscribe(data=>resolve(data))
        break;
        case 'getInstrumentDataCorpActions':
          this.MarketDataService.getInstrumentDataCorpActions().subscribe(data=>resolve(data))
        break;
        case 'getMoexSecurityGroups':
          this.MarketDataService.getInstrumentDataGeneral('getMoexSecurityGroups').subscribe(data=>resolve(data))
        break;
        case 'getMoexSecurityTypes':
          this.MarketDataService.getInstrumentDataGeneral('getMoexSecurityTypes').subscribe(data=>resolve(data))
        break;
        case 'getCorpActionTypes':
          this.MarketDataService.getInstrumentDataGeneral('getCorpActionTypes').subscribe(data=>resolve(data))
        break;
        case 'getCurrencyCodes':
          this.MarketDataService.getInstrumentDataGeneral('getCurrencyCodes').subscribe(data=>resolve(data))
        break;
        case 'getInstrumentAutoCompleteList':
          this.MarketDataService.getMoexInstruments(undefined,undefined,{Action:'getInstrumentAutoCompleteList'}).subscribe(data=>resolve(data))
        break;
        case 'bcTransactionType_Ext':
            this.AccountingDataService.GetTransactionType_Ext('',0,'','','bcTransactionType_Ext').subscribe(data=>resolve(data))
        break;
      }
    })
  }
  getUserData () {
    let userData = JSON.parse(localStorage.getItem('userInfo'))
    console.log('userData',userData);
  }
  indexidCacheData (key:string, data:any) {
    this.dbService
    .add('AAMCache', {code:key, data:data})
    .subscribe((result) => {
      console.log('saved for ',key,': ', result.data.length);
    });
  }
  indexdbDeleteAllCache (key:string) {
    return this.dbService.clear(key)
  }
  async getIndexDBStaticTables (key:string) {
    return new Promise ((resolve) => {
      this.dbService.getByIndex('AAMCache','code',key).subscribe(async data=>{
        if (data) {
          // console.log('for ',key,' is found ', data['data'].length, data, ' rows ');
          resolve(data)
        } else {
          data = await this.fetchDataFromDb(key).then((data)=>{
            this.indexidCacheData(key,data);
            resolve({code:key,'data':data})
          })
        }  
      })
    })
  }
  async reloadIndexDBStaticTable(key:string) {
    return new Promise (resolve => {
      this.dbService.deleteByKey('AAMCache',key).subscribe(res => console.log('deleted data for key:', key));
      this.fetchDataFromDb(key).then (data => {
        this.indexidCacheData(key,data);
        resolve({code:key,'data':data})
      });
    });
  }
}