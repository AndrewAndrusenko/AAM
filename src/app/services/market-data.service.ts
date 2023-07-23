import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { Instruments, InstrumentsMapCodes, instrumentCorpActions, instrumentDetails, marketData, marketDataSources, marketSourceSegements } from '../models/intefaces.model';
interface InstrumentDataSet {
  data:Instruments[],
  action:string
}
@Injectable({
  providedIn: 'root'
})
export class AppMarketDataService {
  private subjectMarketData = new Subject<marketData[]> ()
  private subjectCharMarketData = new Subject<marketData[]> ()
  private subjectCorpData = new Subject<instrumentCorpActions[]> ()
  private subjectInstrument = new Subject<InstrumentDataSet> ()
  private subjectInstrumentDetails = new Subject<instrumentDetails[]> ()
  private subjectCorpActions = new Subject<instrumentCorpActions[]> ()
  private httpOptions = {
    headers: new HttpHeaders({}),
    responseType: 'text'
  };
  constructor(private http:HttpClient) { }
  calculateMA(dayCount:number, data:number[]) {
    console.log('calculateMA', data);
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
      console.log('ma',sum,dayCount,sum / dayCount);
      result.push(sum / dayCount).toFixed(3);
    }
    return result;
  }
  checkLoadedMarketData (sourceCodes:string[],dateToLoad: string):Observable<any[]> {
   const params = {'sourcecodes':sourceCodes,'dateToLoad':dateToLoad,'Action':'checkLoadedMarketData' }
   return this.http.get <any[]>('/api/AAM/MD/getMarketData/', { params: params} )
  }
  deleteOldMarketData (sourceCodes:string[],dateToLoad: string) { 
   const params = {'sourcecodes':sourceCodes,'dateToLoad':dateToLoad }
    return this.http.post ('/api/AAM/MD/deleteMarketData/',{ params: params} ).toPromise()
  }
  async loadMarketDataMOEXiss (sourceCodes:marketSourceSegements[],dateToLoad: string)  {
    console.log('loadMarketDataMOEXiss');
    let logMarketDateLoading = []
    console.log('sourceCodes',sourceCodes);
    sourceCodes.forEach(source => {
      console.log('source',dateToLoad);
      let currentPosition = 0;
      let totalRows = 0;
      let pageSize = 100;  
      let params = source.params;
      params['date'] = dateToLoad;
      params['start'] = 0;
      let totalLoad = 0;
      Object.assign(params, {'iss.only':'history.cursor'})
      delete params['iss.only']
      return this.http.get (source.sourceURL, {params:params} ).subscribe (marketData => {
        currentPosition = marketData[1]['history.cursor'][0]['INDEX'];
        pageSize = marketData[1]['history.cursor'][0]['PAGESIZE'];
        totalRows = marketData[1]['history.cursor'][0]['TOTAL'];
        for (let index = 0; index <= totalRows; index=index + pageSize) {
          params['start'] = index;
          this.http.get (source.sourceURL, {params:params} ).subscribe (marketData => {
          return this.insertMarketData (marketData[1]['history'],source.sourceCode,'MOEXiss').subscribe((rowLoaded) =>{
            totalLoad=totalLoad + rowLoaded
            if (totalLoad>=totalRows) {
              source.checked = false;
              logMarketDateLoading.push ({
              'Source':'MOEXiss - '+ source.sourceCode,
              'Total rows loaded - ' : totalLoad,
              'Total rows fetched from source - ': totalRows,
              'Date': dateToLoad});
              let updone = sourceCodes.reduce((acc,val)=>+val.checked+acc,0)
              updone? null: this.getMarketData().subscribe (marketData => {
              console.log('updone',updone);
                console.log('sourceCodes',  sourceCodes)
                this.sendReloadMarketData (marketData)});
              
            }
            return logMarketDateLoading
          })
          })
        }
      })
    });
    return logMarketDateLoading;
  }
  loadMarketDataMarketStack (sourceCodes:marketSourceSegements[],dateToLoad: string): any[]  {
    console.log('loadMarketDataMarketStack');
    let logMarketDateLoading = []
    sourceCodes.forEach(source => {
      this.getInstrumentsCodes('msFS',true).subscribe(codesList => {
        console.log('codelist',codesList[0].code);
        let List = codesList[0].code
        let firstPosition=0;
        let index = 0;
        let slicedCodesList = []
        do {
          let params = source.params;
          params['date_from'] = dateToLoad;
          params['date_to'] = dateToLoad;
          firstPosition=index;
          index = index+99 > List.length? List.length: index+99
          slicedCodesList.push(List.slice(firstPosition,index).join())
          params['symbols'] = slicedCodesList[slicedCodesList.length-1];
          console.log( 'params',params);
          this.http.get <any[]> (source.sourceURL, {params:params} ).subscribe (marketData => {
            console.log('marketData', marketData);
            return this.insertMarketData (marketData['data'],source.sourceCode,'MScom').subscribe((rowLoaded) =>{
              source.checked = false;
              logMarketDateLoading.push ({
                'Source':'Marketstack - '+ source.sourceCode,
                'Total rows loaded - ' : rowLoaded,
                'Total rows fetched from source - ': marketData.length,
                'Date': dateToLoad
              });
              console.log('md',marketData);
              this.getMarketData().subscribe (marketData => this.sendReloadMarketData (marketData)); 
              return logMarketDateLoading = marketData
            })
          }) 
        } while (index < List.length);
      })
    })
    return logMarketDateLoading;
  }

  insertMarketData (dataToInsert:any,sourceCode:string, gloabalSource:string): Observable<number> {
    return  this.http.post <number> ('/api/AAM/MD/importData/',
    {'dataToInsert': dataToInsert,'sourceCode':sourceCode, 'gloabalSource':gloabalSource})
  }
  getMarketData (rowslimit:number=1000000,sorting:string=' tradedate DESC', searchParameters?:any):Observable<marketData[]> {
    let params = {};
    (searchParameters !== null) ?  params = {...params,...searchParameters}: null;
    (rowslimit !== null) ?  Object.assign(params,{'rowslimit':rowslimit}): null;
    (sorting !== null) ?  Object.assign(params,{'sorting':sorting}): null;
    return this.http.get <marketData[]> ('/api/AAM/MD/getMarketData/', { params: params } )
  }
  getMarketDataSources ():Observable<marketDataSources[]> {
    return this.http.get <marketDataSources[]> ('/api/AAM/MD/getMarketDataSources/')
  }
  getMoexInstrumentsList ():Observable<any[]> {
    return this.http.get <any[]> ('/api/AAM/MD/getMoexInstrumentsList/')
  }
  getInstrumentsCodes (mapcode:string, resasarray?:boolean, secid?:string):Observable<InstrumentsMapCodes[]> {
    const params = {mapcode:mapcode,secid:secid, resasarray:resasarray}
    return this.http.get <InstrumentsMapCodes[]> ('/api/AAM/MD/getInstrumentsCodes/',{params:params})
  }
  getInstrumentDataGeneral (dataType:string, fieldtoCheck?:string): Observable <any[]> {
    const params = {dataType:dataType}
    fieldtoCheck!==null? Object.assign(params,{fieldtoCheck:fieldtoCheck}) : null;
    return this.http.get <any[]> ('/api/AAM/MD/getInstrumentDataGeneral/',{params:params})
  }
  getMoexInstruments (rowslimit:number=100000,sorting:string=' secid ASC', searchParameters?:any):Observable<Instruments[]> {
    let params = {};
    (searchParameters !== null) ?  params = {...params,...searchParameters}: null;
    (rowslimit !== null) ?  Object.assign(params,{'rowslimit':rowslimit}): null;
    (sorting !== null) ?  Object.assign(params,{'sorting':sorting}): null;
    return this.http.get <Instruments[]> ('/api/AAM/MD/getMoexInstruments/',{params:params})
  }
  getRedisMoexInstruments ():Observable<Instruments[]> {
    return this.http.get <Instruments[]> ('/api/AAM/Redis/getMoexInstrumentsList/')
  }
  getInstrumentDataDetails (secid?:string): Observable <instrumentDetails[]> {
    let params = {};
    secid?  Object.assign(params,{secid:secid}): null;
    return this.http.get <instrumentDetails[]> ('/api/AAM/MD/getInstrumentDetails/',{params:params})
  }
  getInstrumentDataCorpActions (isin?:string): Observable <instrumentCorpActions[]> {
    let params = {};
    isin?  Object.assign(params,{isin:isin}): null;
    return this.http.get <instrumentCorpActions[]> ('/api/AAM/MD/getInstrumentDataCorpActions/',{params:params})
  }
  sendReloadMarketData ( dataSet:marketData[]) {
    this.subjectMarketData.next(dataSet); 
  }
  getReloadMarketData(): Observable<marketData[]> { 
    return this.subjectMarketData.asObservable(); //it returns as an observable to which the receiver funtion will subscribe
  }
  sendMarketDataForChart ( dataSet:marketData[]) {
    this.subjectCharMarketData.next(dataSet); 
  }
  getMarketDataForChart(): Observable<marketData[]> { 
    return this.subjectCharMarketData.asObservable(); //it returns as an observable to which the receiver funtion will subscribe
  }
  sendCorpActionData ( dataSet:instrumentCorpActions[]) {
    this.subjectCorpData.next(dataSet); 
  }
  getCorpActionData(): Observable<instrumentCorpActions[]> { 
    return this.subjectCorpData.asObservable(); //it returns as an observable to which the receiver funtion will subscribe
  }
  createInstrument (data:any): Observable<Instruments[]>  { 
    return this.http.post  <Instruments[]> ('/api/AAM/MD/InstrumentCreate/',{'data': data})
  } 
  deleteInstrument (id:string): Observable<Instruments[]> { 
    return this.http.post  <Instruments[]> ('/api/AAM/MD/InstrumentDelete/',{'id': id})
  } 
  updateInstrument (data:any):  Observable<Instruments[]>  { 
    return this.http.post <Instruments[]> ('/api/AAM/MD/InstrumentEdit/',{'data': data})
  }
  sendInstrumentDataToUpdateTableSource ( data:Instruments[], action: string) {
    let dataSet = {
      data: data,
      action:action
    }
    this.subjectInstrument.next(dataSet); 
  }
  getInstrumentDataToUpdateTableSource(): Observable<InstrumentDataSet> { 
    return this.subjectInstrument.asObservable(); 
  }
  updateInstrumentDetails (data:any, action:string):  Observable<instrumentDetails[]>  { 
    return this.http.post <instrumentDetails[]> ('/api/AAM/MD/UpdateInstrumentDetails/',{data:data, action:action})
  }
  updateInstrumentDataCorpActions (data:any, action:string):  Observable<instrumentDetails[]>  { 
    return this.http.post <instrumentDetails[]> ('/api/AAM/MD/UpdateInstrumentDataCorpActions/',{data:data, action:action})
  }
  sendReloadInstrumentDetails ( dataSet:instrumentDetails[]) {
    this.subjectInstrumentDetails.next(dataSet); 
  }
  sendReloadDataCorpActions ( dataSet:instrumentCorpActions[]) {
    this.subjectCorpActions.next(dataSet); 
  }
}

