import { Injectable } from '@angular/core';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { AppAccountingService } from './accounting.service';
import { Observable, catchError, of, switchMap, tap } from 'rxjs';
import { AppInvestmentDataServiceService } from './investment-data.service.service';
import { CurrenciesDataService } from './currencies-data.service';
import { InstrumentDataService } from './instrument-data.service';
import { corporateActionsTypes, instrumentCorpActions, instrumentDetails, moexBoard, moexSecurityGroup, moexSecurityType } from '../models/instruments.interfaces';
import { ClientData, StrategiesGlobalData, counterParty, currencyCode, currencyPair, currencyRateList } from '../models/interfaces.model';
import { bcTransactionType_Ext } from '../models/accountng-intefaces.model';
export interface cacheAAM {
  code:string,
  data:cachedDataType
}
 type cachedDataType = corporateActionsTypes[]| 
moexSecurityGroup[]| 
moexSecurityType[]|
moexBoard[]|
currencyRateList[]|
bcTransactionType_Ext[]|
ClientData[]|
StrategiesGlobalData[]|
instrumentCorpActions[]|
instrumentDetails[]|
currencyCode[]|
currencyPair[]|
counterParty[]|
string[][]|
{secid:string}[]|{isin:string}[];
@Injectable({
  providedIn: 'root'
})
export class indexDBService {
  constructor(
    private dbService: NgxIndexedDBService,
    private AccountingDataService:AppAccountingService, 
    private InvestmentDataService : AppInvestmentDataServiceService,   
    private CurrenciesDataSrv: CurrenciesDataService,
    private InstrumentDataS:InstrumentDataService,
  ) { }
  getUserData () {
    let userData = JSON.parse(localStorage.getItem('userInfo'))
  }
  indexdbDeleteAllCache (key:string) {
    return this.dbService.clear(key)
  }
  indexidCacheData (key:string, data:cachedDataType):Observable<cacheAAM> {
    return this.dbService.add('AAMCache', {code:key, data:data}).pipe(
      catchError(() => of({code:'null',data:[]})),
      tap(result=>result.data.length? console.log('saved for ',key,': ', result.data.length) : console.log('already saved ',key))
    )
  }
  getIndexDBStaticTables (key:string):Observable<cacheAAM> {
    return (this.dbService.getByIndex('AAMCache','code',key) as Observable<cacheAAM>).pipe (
     switchMap(cachedData=> cachedData? of(cachedData) : this.fetchDataFromDb(key).pipe(switchMap(data=>this.indexidCacheData(key,data)))) 
    )
  }
  fetchDataFromDb (key:string): Observable<cachedDataType> {
  let fetchServiceFunction = new Observable<cachedDataType> 
      switch (key) {
        case 'getBoardsDataFromInstruments':
          fetchServiceFunction =  this.InstrumentDataS.getInstrumentDataGeneral('getBoardsDataFromInstruments')
        break;
        case 'getInstrumentDataDetails':
           fetchServiceFunction = this.InstrumentDataS.getInstrumentDataDetails()
        break;
        case 'getInstrumentDataCorpActions':
          fetchServiceFunction = this.InstrumentDataS.getInstrumentDataCorpActions()
        break;
        case 'getMoexSecurityGroups':
          fetchServiceFunction = this.InstrumentDataS.getInstrumentDataGeneral('getMoexSecurityGroups')
        break;
        case 'getMoexSecurityTypes':
          fetchServiceFunction = this.InstrumentDataS.getInstrumentDataGeneral('getMoexSecurityTypes')
        break;
        case 'getCorpActionTypes':
          fetchServiceFunction = this.InstrumentDataS.getInstrumentDataGeneral('getCorpActionTypes')
        break;
        case 'getCurrencyCodes':
         fetchServiceFunction =  this.CurrenciesDataSrv.getCurrencyCodes()
        break;
        case 'getCurrencyPairsList':
         fetchServiceFunction =  this.CurrenciesDataSrv.getCurrencyPairsList()
        break;
        case 'getInstrumentAutoCompleteList':
         fetchServiceFunction =  this.InstrumentDataS.getMoexInstruments(undefined,undefined,{Action:'getInstrumentAutoCompleteList'})
        break;
        case 'bcTransactionType_Ext':
         fetchServiceFunction =  this.AccountingDataService.GetTransactionType_Ext('',0,'','','bcTransactionType_Ext')
        break;
        case 'getCounterPartyList':
         fetchServiceFunction =  this.InvestmentDataService.getClientData(undefined,undefined,'getCounterPartyList')
        break
        case 'getModelPortfolios':
         fetchServiceFunction =  this.InvestmentDataService.getGlobalStategiesList(undefined,undefined,'getModelPortfolios')
        break
      }
      return fetchServiceFunction;
  }
  reloadIndexDBStaticTable(key:string): Observable<cachedDataType> {
    return this.dbService.deleteByKey('AAMCache',key).pipe(
        tap(()=>console.log('deleted data for key:', key)),
        switchMap(()=>this.fetchDataFromDb(key))
      )
  }
  rewrteIndexDBStaticTable(key:string,data:cachedDataType): Observable<cacheAAM> {
    return  this.dbService.deleteByKey('AAMCache',key).pipe(switchMap(()=>this.indexidCacheData(key,data)))
  }
}