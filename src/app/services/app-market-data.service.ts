import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, repeat } from 'rxjs';
import { InstrumentsMapCodes, marketData, marketDataSources, marketSourceSegements, moexMarketDataForiegnShres } from '../models/accounts-table-model';
import { param } from 'jquery';
var ROOT_PATH = 'https://echarts.apache.org/examples';

@Injectable({
  providedIn: 'root'
})
export class AppMarketDataService {
  private subjectMarketData = new Subject<marketData[]> ()
  private httpOptions = {
    headers: new HttpHeaders({}),
    responseType: 'text'
  };
  constructor(private http:HttpClient) { }
  getDataForChart ():Observable<any[]>{
   return this.http.get <any[]> (ROOT_PATH + '/data/asset/data/stock-DJI.json')
  }
  checkLoadedMarketData (sourceCodes:string[],dateToLoad: string):Observable<any[]> {
   const params = {'sourcecodes':sourceCodes,'dateToLoad':dateToLoad,'Action':'checkLoadedMarketData' }
   return this.http.get <any[]>('/api/AAM/MD/getMarketData/', { params: params} )
  }
  deleteOldMarketData (sourceCodes:string[],dateToLoad: string) { 
   const params = {'sourcecodes':sourceCodes,'dateToLoad':dateToLoad }
    return this.http.post ('/api/AAM/MD/deleteMarketData/',{ params: params} ).toPromise()
  }
  loadMarketDataExteranalSource (sourceCodes:marketSourceSegements[],dateToLoad: string): any[]  {
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
        for (let index = 0; index < totalRows; index=index + pageSize) {
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

              sourceCodes.reduce((acc,val)=>+val.checked+acc,0)? null: this.getMarketData().subscribe (marketData => this.sendReloadMarketData (marketData));
              
              console.log('sourceCodes',  sourceCodes)
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
    let logMarketDateLoading = []
    sourceCodes.forEach(source => {
      this.getInstrumentsCodes('SP500',true).subscribe(codesList => {
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
          this.http.get <any[]> ('source.sourceURL', {params:params} ).subscribe (marketData => {
            /* return this.insertMarketData (marketData[1]['history'],source.sourceCode,'MOEXiss').subscribe((rowLoaded) =>{
            totalLoad=totalLoad + rowLoaded
            if (totalLoad>=totalRows) {
           */source.checked = false;
            logMarketDateLoading.push ({
            'Source':'Marketstack - '+ source.sourceCode,
            'Total rows loaded - ' : 0,
            'Total rows fetched from source - ': marketData.length,
            'Date': dateToLoad});
            console.log('md',marketData);
            /* sourceCodes.reduce((acc,val)=>+val.checked+acc,0)? null: this.getMarketData().subscribe (marketData => this.sendReloadMarketData (marketData)); */
            console.log('sourceCodes',sourceCodes)
            return logMarketDateLoading = marketData
          })
        } while (index < List.length);

 
      })
    })
  return logMarketDateLoading
  }

  insertMarketData (dataToInsert:any,sourceCode:string, gloabalSource:string): Observable<number> {
    console.log('data',dataToInsert);
    return  this.http.post <number> ('/api/AAM/MD/importData/',
    {'dataToInsert': dataToInsert,'sourceCode':sourceCode, 'gloabalSource':gloabalSource})
  }
  getMarketData (searchParameters?:any):Observable<marketData[]> {
    let params = {};
    (searchParameters !== null) ?  params = {...params,...searchParameters}: null
    return this.http.get <marketData[]> ('/api/AAM/MD/getMarketData/', { params: params } )
  }
  getMarketDataSources ():Observable<marketDataSources[]> {
    return this.http.get <marketDataSources[]> ('/api/AAM/MD/getMarketDataSources/')
  }
  getInstrumentsCodes (mapcode:string, resasarray?:boolean, secid?:string):Observable<InstrumentsMapCodes[]> {
    const params = {mapcode:mapcode,secid:secid, resasarray:resasarray}
    return this.http.get <InstrumentsMapCodes[]> ('/api/AAM/MD/getInstrumentsCodes/',{params:params})
  }

  sendReloadMarketData ( dataSet:marketData[]) { //the component that wants to update something, calls this fn
    this.subjectMarketData.next(dataSet); //next() will feed the value in Subject
  }
  getReloadMarketData(): Observable<marketData[]> { //the receiver component calls this function 
    return this.subjectMarketData.asObservable(); //it returns as an observable to which the receiver funtion will subscribe
  }
  
}


