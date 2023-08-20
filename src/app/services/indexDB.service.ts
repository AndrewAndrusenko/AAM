import { Injectable } from '@angular/core';
import { AppMarketDataService } from './market-data.service';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { AppAccountingService } from './accounting.service';
import { catchError, of } from 'rxjs';
import { AppInvestmentDataServiceService } from './investment-data.service.service';
import { CurrenciesDataService } from './currencies-data.service';
import { InstrumentDataService } from './instrument-data.service';
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
    private InvestmentDataService : AppInvestmentDataServiceService,   
    private CurrenciesDataSrv: CurrenciesDataService,
    private InstrumentDataS:InstrumentDataService,
  ) { }
  indexDBcacheData (key:string,data:any) {
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
          this.InstrumentDataS.getInstrumentDataGeneral('getBoardsDataFromInstruments').subscribe(data=>resolve(data))
        break;
        case 'getInstrumentDataDetails':
          this.InstrumentDataS.getInstrumentDataDetails().subscribe(data=>resolve(data))
        break;
        case 'getInstrumentDataCorpActions':
          this.InstrumentDataS.getInstrumentDataCorpActions().subscribe(data=>resolve(data))
        break;
        case 'getMoexSecurityGroups':
          this.InstrumentDataS.getInstrumentDataGeneral('getMoexSecurityGroups').subscribe(data=>resolve(data))
        break;
        case 'getMoexSecurityTypes':
          this.InstrumentDataS.getInstrumentDataGeneral('getMoexSecurityTypes').subscribe(data=>resolve(data))
        break;
        case 'getCorpActionTypes':
          this.InstrumentDataS.getInstrumentDataGeneral('getCorpActionTypes').subscribe(data=>resolve(data))
        break;
        case 'getCurrencyCodes':
          this.CurrenciesDataSrv.getCurrencyCodes().subscribe(data=>resolve(data))
        break;
        case 'getCurrencyPairsList':
          this.CurrenciesDataSrv.getCurrencyPairsList().subscribe(data=>resolve(data))
        break;
        case 'getInstrumentAutoCompleteList':
          this.InstrumentDataS.getMoexInstruments(undefined,undefined,{Action:'getInstrumentAutoCompleteList'}).subscribe(data=>resolve(data))
        break;
        case 'bcTransactionType_Ext':
            this.AccountingDataService.GetTransactionType_Ext('',0,'','','bcTransactionType_Ext').subscribe(data=>resolve(data))
        break;
        case 'getCounterPartyList':
          this.InvestmentDataService.getClientData(undefined,undefined,'getCounterPartyList').subscribe(data => resolve(data))
        break
        case 'getCurrencyPairsList':
          this.InvestmentDataService.getClientData(undefined,undefined,'getCounterPartyList').subscribe(data => resolve(data))
        break
      }
    })
  }
  getUserData () {
    let userData = JSON.parse(localStorage.getItem('userInfo'))
  }
  indexidCacheData (key:string, data:any) {
    this.dbService.add('AAMCache', {code:key, data:data}).pipe(
      catchError(() => of({data:[]}))
    ).subscribe(result => {
      result.data.length? console.log('saved for ',key,': ', result.data.length) : console.log('already saved ',key);
    });
  }
  indexdbDeleteAllCache (key:string) {
    return this.dbService.clear(key)
  }
  async getIndexDBStaticTables (key:string) {
    return new Promise (resolve => {
      this.dbService.getByIndex('AAMCache','code',key).subscribe(async data=>{
        data? resolve(data) : this.fetchDataFromDb(key).then(data=>{
            this.indexidCacheData(key,data);
            resolve({code:key,'data':data})
          })
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