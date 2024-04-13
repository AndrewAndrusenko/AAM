import { Injectable } from '@angular/core';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { AppAccountingService } from './accounting.service';
import { Observable, Subject, catchError, exhaustMap, of, switchMap, tap } from 'rxjs';
import { AppInvestmentDataServiceService } from './investment-data.service.service';
import { CurrenciesDataService } from './currencies-data.service';
import { InstrumentDataService } from './instrument-data.service';
import { corporateActionsTypes, instrumentCorpActions, instrumentDetails, moexBoard, moexSecurityGroup, moexSecurityType } from '../models/instruments.interfaces';
import { ClientData, StrategiesGlobalData, counterParty, currencyCode, currencyPair, currencyRateList, marketDataSources } from '../models/interfaces.model';
import { bcAccountType_Ext, bcTransactionType_Ext } from '../models/accountng-intefaces.model';
export interface cacheAAM {
  code:string,
  data:cachedDataType
}

 type cachedDataType = marketDataSources[]|
                      bcAccountType_Ext[]|
                      corporateActionsTypes[]| 
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
  public pipeBoardsMoexSet = new Subject<boolean> ()
  public pipeMarketSourceSet = new Subject<boolean> ()
  private subjectBoardsMoexReady = new Subject<moexBoard[]>
  private subjectMarketSourceReady = new Subject<marketDataSources[]>

  constructor(
    private dbService: NgxIndexedDBService,
    private AccountingDataService:AppAccountingService, 
    private InvestmentDataService : AppInvestmentDataServiceService,   
    private CurrenciesDataSrv: CurrenciesDataService,
    private InstrumentDataS:InstrumentDataService,
  ) 
  { 
    this.pipeBoardsMoexSet.pipe(
      exhaustMap(()=>this.getIndexDBStaticTables('getBoardsDataFromInstruments'))
    ).subscribe(data=>this.sendBoardsMoexSet(data.data as moexBoard[]))
    this.pipeMarketSourceSet.pipe(
      exhaustMap(()=>this.getIndexDBStaticTables('getMarketDataSources'))
    ).subscribe(data=>this.sendMarketSourceSet(data.data as marketDataSources[]))
  }
  sendBoardsMoexSet (data:moexBoard[]) {this.subjectBoardsMoexReady.next(data) }
  receiveBoardsMoexSet ():Observable<moexBoard[]> {return this.subjectBoardsMoexReady.asObservable()}
  sendMarketSourceSet (data:marketDataSources[]) {this.subjectMarketSourceReady.next(data) }
  receivMarketSourceSett ():Observable<marketDataSources[]> {return this.subjectMarketSourceReady.asObservable()}
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
        case 'getInstrumentFutures':
         fetchServiceFunction =  this.InstrumentDataS.getDerivativesList()
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
        case 'getMarketDataSources':
         fetchServiceFunction =  this.InstrumentDataS.getMarketDataSources()
        break
        case 'bcAccountType_Ext':
         fetchServiceFunction = this.AccountingDataService.GetAccountTypeList('',0,'','','bcAccountType_Ext')
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