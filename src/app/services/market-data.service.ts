import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { InstrumentsMapCodes, marketData, marketDataSources, marketSourceSegements } from '../models/interfaces.model';
import { HadlingCommonDialogsService } from './hadling-common-dialogs.service';
interface marketDataCheck {
  sourcecode :string,
  count:number
}
export interface marketDateLoaded {
  'Source':string,
  'Total rows loaded - ' : number,
  'Total rows fetched from source - ': number,
  'Date': string
}
export interface logLoadingState {
  Message:string,
  State:string
}
interface moexIssDataObject {
  history: moexIssDataHistory[],
  'history.cursor':{ 
    INDEX: number, 
    TOTAL: number, 
    PAGESIZE: number
  }[]
}
interface moexIssDataHistory {
  ADMITTEDQUOTE: number,
  ADMITTEDVALUE: number,
  BOARDID: string,
  CLOSE: number,
  HIGH: number,
  LEGALCLOSEPRICE: number,
  LOW: number,
  MARKETPRICE2: number,
  MARKETPRICE3: number,
  MARKETPRICE3TRADESVALUE: number,
  MP2VALTRD: number,
  NUMTRADES: number,
  OPEN: number,
  SECID: string,
  TRADEDATE: string,
  TRADINGSESSION: number,
  VALUE: number,
  VOLUME: number,
  WAPRICE: number,
  WAVAL: number
}
interface MarketStackObject {
  data: MarketStackData[],
  pagination: {
  limit: number,
  offset: number,
  count: number,
  total: number
}
}
interface MarketStackData {
    open: number,
    high: number,
    low: number,
    close: number,
    volume: number,
    adj_high: number,
    adj_low: number,
    adj_close: number,
    adj_open: number,
    adj_volume: number,
    split_factor: number,
    dividend: number,
    symbol: string,
    exchange: string,
    date: string
}
interface marketDataSearchParams {
  dataRange? : {},
  secidList?: string[],
  amount?:number
  marketSource? : string[],
  boards? : string[],
  secid?:  string[],
  dateRangeStart?:string,
  dateRangeEnd?:string
}
type uploadMarketDataFunc = (ourceCodes:marketSourceSegements[],dateToLoad: string) => Observable<
{dataLoaded: marketDateLoaded[],deletedRows:number,state:logLoadingState}>;
@Injectable({
  providedIn: 'root'
})
export class AppMarketDataService {

  private subjectMarketData = new Subject<marketData[]> ()
  private subjectCharMarketData = new Subject<marketData[]> ()
  private deletedMarketDataRows:number;
  constructor(
    private http:HttpClient,
    private CommonDialogsService:HadlingCommonDialogsService,
    ) { }
  updateMarketQuotes(dataToUpdate: marketData,action1:string):Observable<marketData[]> {
    return this.http.post <marketData[]>('/api/AAM/MD/updateMarketQuote/',{data:dataToUpdate,action:action1})
  }
  calculateMA(dayCount:number, data:number[]) {
    let result = [];
    for (let i = 0, len = data.length; i < len; i++) {
      if (i < dayCount) {
        result.push('-');
        continue;
      }
      let sum:number = 0;
      for (let j = 0; j < dayCount; j++) {
        sum += + data[i - j];
      }
      result.push(Math.round(sum / dayCount*100)/100);
    }
    return result;
  }
  uploadMarketData( dateToLoad: string, sourcesData:marketSourceSegements[], replaceCurrentData:boolean) :
  Observable<{dataLoaded: marketDateLoaded[],deletedRows:number,state:logLoadingState}>{
    let functionToLoadData:uploadMarketDataFunc
    switch (sourcesData[0].sourceGlobal) {
      case 'marketstack.com':
        functionToLoadData = this.loadMarketDataMarketStack.bind(this)
      break;
      case 'iss.moex.com':
        functionToLoadData = this.loadMarketDataMOEXiss.bind(this)
      break;
    }
    let loadingDataState:logLoadingState = {Message : 'Loading', State: 'Pending'}
    let sourceCodesArray:string[] = sourcesData.map(el=>{return el.sourceCode})
    return this.checkLoadedMarketData (sourceCodesArray,dateToLoad).pipe(
      tap(checkData=>replaceCurrentData===false&&checkData.length>0? loadingDataState = {Message:'Loading terminated. Data have been already loaded!', State : 'terminated'}:null),
      switchMap(checkData=>replaceCurrentData&&checkData.length>0?  this.CommonDialogsService.confirmDialog('Delete all data for codes: ' + sourceCodesArray):of({action: null,isConfirmed: null, buttonLabel: null})),
      tap(confirm=>confirm.isConfirmed===false? loadingDataState = {Message: 'Loading has been canceled.', State: 'terminated'}:null),
      switchMap(confirm=>confirm.isConfirmed===true? this.deleteOldMarketData(sourceCodesArray, dateToLoad):of({deletedRows:0})),
      tap(deletedRows=>this.deletedMarketDataRows =deletedRows.deletedRows),
      switchMap(()=>loadingDataState.State==='Pending'? functionToLoadData(sourcesData, dateToLoad)
          :of({ dataLoaded: [], deletedRows: 0,state:loadingDataState}))
    )
  } 
  loadMarketDataMOEXiss (sourceCodes:marketSourceSegements[],dateToLoad: string):Observable<{dataLoaded: marketDateLoaded[],deletedRows:number,state:logLoadingState}>  {
    let uploadStreams :Observable<marketDateLoaded>[]=[];
    sourceCodes.forEach(source => {
      let totalRows = 0;
      let getIssMoexStreams :Observable<moexIssDataObject[]>[]=[];
      let params = source.params;
      params.date = dateToLoad;
      params.start = 0;
      uploadStreams.push(
      this.http.get <moexIssDataObject[]> (source.sourceURL, {params:params}).pipe(
        tap (marketData=>{
          totalRows = marketData[1]['history.cursor'][0].TOTAL;
          for (let index = 0; index <= totalRows; index=index + marketData[1]['history.cursor'][0].PAGESIZE) {
            params.start = index;
            getIssMoexStreams.push(this.http.get <moexIssDataObject[]>(source.sourceURL, {params:params}))
          }
        }),
        switchMap(()=>forkJoin(getIssMoexStreams)),
        map(dataIssMoex=>dataIssMoex.map(el=>{return el[1].history.flat()}).flat()),
        switchMap(dataIssMoex=> this.insertMarketData (dataIssMoex,source.sourceCode,'MOEXiss')),
        switchMap(inserted=>of({'Source':'MOEXiss - '+ source.sourceCode,'Total rows loaded - ' : inserted,'Total rows fetched from source - ': totalRows,'Date': dateToLoad}))
      ))
     })
    return forkJoin(uploadStreams).pipe(
      map(data=>({
          dataLoaded:data, 
          deletedRows: this.deletedMarketDataRows,
          state:{Message:'Loaded',State:'Success'}
        })));
  }
  loadMarketDataMarketStack (sourceCodes:marketSourceSegements[],dateToLoad: string):Observable<{dataLoaded: marketDateLoaded[],deletedRows:number,state:logLoadingState}>  {
    let uploadStreams :Observable<marketDateLoaded>[]=[];
    sourceCodes.forEach(source => {
      let totalRows = 0;
      let params = source.params;
      params.date_from = dateToLoad;
      params.date_to = dateToLoad;
      uploadStreams.push(
      this.getInstrumentsCodes('msFS',true).pipe(
        tap(codes=>params.symbols=codes[0].code.join()),
        switchMap(()=> this.http.get <MarketStackObject> (source.sourceURL, {params:params})),
        tap(data=>totalRows=data.data.length),
        switchMap(marketData=> this.insertMarketData (marketData.data,source.sourceCode,'MScom')),
        switchMap(()=> this.moveMarketStackToMainTable(new Date(dateToLoad).toDateString())),
        switchMap(inserted=>of({'Source':'Marketstack - '+ source.sourceCode,'Total rows loaded - ' : inserted,'Total rows fetched from source - ': totalRows,'Date': dateToLoad}))
      ))
    })
    return forkJoin(uploadStreams).pipe(
      map(data=>({
          dataLoaded:data, 
          deletedRows: this.deletedMarketDataRows,
          state:{Message:'Loaded',State:'Success'}
        })));
  }
  checkLoadedMarketData (sourceCodes:string[],dateToLoad: string):Observable<marketDataCheck[]> {
    const params = {'sourcecodes':sourceCodes,'dateToLoad':dateToLoad,'Action':'checkLoadedMarketData' }
    return this.http.get <marketDataCheck[]>('/api/AAM/MD/getMarketData/', { params: params} )
  }
  deleteOldMarketData (sourceCodes:string[],dateToLoad: string):Observable<{deletedRows:number}> { 
     const params = {'sourcecodes':sourceCodes,'dateToLoad':dateToLoad }
     return this.http.post <{deletedRows:number}> ('/api/AAM/MD/deleteMarketData/',{ params: params})
  }
  getInstrumentsCodes (mapcode:string, resasarray?:boolean, secid?:string):Observable<InstrumentsMapCodes[]> {
    const params = {mapcode:mapcode,secid:secid, resasarray:resasarray}
    return this.http.get <InstrumentsMapCodes[]> ('/api/AAM/MD/getInstrumentsCodes/',{params:params})
  }
  getMoexInstrumentsList ():Observable<number[]> {
    return this.http.get <number[]> ('/api/AAM/MD/getMoexInstrumentsList/')
  }
  insertMarketData (dataToInsert:MarketStackData[]|moexIssDataHistory[],sourceCode:string, gloabalSource:string): Observable<number> {
    return  this.http.post <number> ('/api/AAM/MD/importData/',
    {'dataToInsert': dataToInsert,'sourceCode':sourceCode, 'gloabalSource':gloabalSource})
  }
  moveMarketStackToMainTable (dateToMove:string) :Observable<number> {
    return this.http.post <{o_rows_moved:number}[]> ('/api/AAM/MD/importData/',{date_to_move:dateToMove,gloabalSource:'MScomMoveToMainTable'}).pipe(map(data=>data[0].o_rows_moved))
  }  
  getMarketQuote (secid:string,trade_date:string):Observable<marketData[]> {
    const params = {secid:secid,trade_date:trade_date,Action:'getMarketQuote',}
    return this.http.get <marketData[]> ('/api/AAM/MD/getMarketData/', { params: params } )
  }
  getMarketData (rowslimit:number=1000000,sorting:string=null, searchParameters?:marketDataSearchParams):Observable<marketData[]> {
    let params = {};
    (searchParameters !== null) ?  params = {...params,...searchParameters}: null;
    (rowslimit !== null) ?  Object.assign(params,{'rowslimit':rowslimit}): null;
    (sorting !== null) ?  Object.assign(params,{'sorting':sorting}): null;
    return this.http.get <marketData[]> ('/api/AAM/MD/getMarketData/', { params: params } )
  }

  sendReloadMarketData ( dataSet:marketData[]) {
    this.subjectMarketData.next(dataSet); 
  }
  getReloadMarketData(): Observable<marketData[]> { 
    return this.subjectMarketData.asObservable(); 
  }
  sendMarketDataForChart ( dataSet:marketData[]) {
    this.subjectCharMarketData.next(dataSet); 
  }
  getMarketDataForChart(): Observable<marketData[]> { 
    return this.subjectCharMarketData.asObservable(); 
  }
 
}

