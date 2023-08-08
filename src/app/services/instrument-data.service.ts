import { Injectable } from '@angular/core';
import { Observable, Subject, map, observable, of, tap } from 'rxjs';
import { couponPeriodInfo } from '../models/intefaces.model';
import { HttpClient } from '@angular/common/http';
import { Instruments, instrumentCorpActions, instrumentDetails} from '../models/intefaces.model';
import { number } from 'echarts';

interface InstrumentDataSet {
  data:Instruments[],
  action:string
}
interface coupon_data {
  days:number, 
  accured_interest:string,
  coupon_details:string
}
@Injectable({
  providedIn: 'root'
})
export class InstrumentDataService {
  private subjectCorpData = new Subject<instrumentCorpActions[]> ()
  private subjectInstrument = new Subject<InstrumentDataSet> ()
  private subjectInstrumentDetails = new Subject<instrumentDetails[]> ()
  private subjectCorpActions = new Subject<instrumentCorpActions[]> ()
  constructor(private http:HttpClient) { }

  getcouponPeriodInfo(vdate:string,tidinstrument:string,facevalue:number,qty:number):Observable<coupon_data> {
    const params = {'vdate':new Date(vdate).toISOString(),'tidinstrument':tidinstrument };
    let coupon_data : coupon_data = {days:0, accured_interest:null,coupon_details:null}
    return this.http.get <coupon_data> ('api/AAM/MD/getcouponPeriodInfo/', {params:params}).pipe(
      map(coupon => {
        let last_coupon_date = new Date(coupon[1].date);
        let value_date = new Date(vdate);
        coupon_data.days = Math.round( Math.ceil(Math.abs((value_date.getTime()-last_coupon_date.getTime()))/(1000 * 3600 * 24)));
        coupon_data.coupon_details = (''+JSON.stringify(coupon[0]) + ', lastCouponDate:'+ coupon[1].date.toString()+ ', days:' + coupon_data.days.toString() +', facevalue: '+ facevalue.toString());
        coupon_data.accured_interest = (facevalue*qty*coupon[0].couponrate/100*coupon_data.days/365).toFixed(2);
        return (coupon_data)
      })
    )
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
