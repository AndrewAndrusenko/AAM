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
  accuredInterest:string,
  couponDetails:string
  couponPeriod:number,
  couponPeriodAmount:number,
  currentCouponAmount:number,
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

  getcouponPeriodInfo(vdate:string,tidinstrument:string,facevalue:number,qty:number):Observable<any> {
    const params = {'vdate':new Date(vdate).toISOString(),'tidinstrument':tidinstrument };
    let coupon_data : coupon_data = {days:0, accuredInterest:null,couponDetails:null, couponPeriod:null, couponPeriodAmount:null,currentCouponAmount:null}
    return this.http.get <any> ('api/AAM/MD/getcouponPeriodInfo/', {params:params}).pipe(
      map(coupon => {
        if (coupon.length<2||coupon[0]['couponrate']==0) {
          return (coupon_data = {days:0, accuredInterest:'0',couponDetails:'zero coupon rate or only one coupon period', couponPeriod:0, couponPeriodAmount:0,currentCouponAmount:0})
        }
        let lastCouponDate = new Date(coupon[1]['date']);
        let currentCouponDate = new Date(coupon[0]['date']);
        let valueDate = new Date(vdate);
        coupon_data.couponPeriod = Math.round( Math.ceil(Math.abs((currentCouponDate.getTime()-lastCouponDate.getTime()))/(1000 * 3600 * 24)));
        coupon_data.days = Math.round( Math.ceil(Math.abs((valueDate.getTime()-lastCouponDate.getTime()))/(1000 * 3600 * 24)));
        coupon_data.couponPeriodAmount = Number((coupon_data.couponPeriod/365*facevalue*coupon[0]['couponrate']/100).toFixed(2));
        coupon_data.currentCouponAmount = Number(((coupon_data.couponPeriodAmount)*coupon_data.days/coupon_data.couponPeriod).toFixed(2)); 
        coupon_data.couponDetails = (JSON.stringify(coupon[0]) + ', lastCouponDate:'+ new Date(coupon[1]['coupon_date']).toLocaleDateString()+ ', days:' + coupon_data.days.toString() +', facevalue: '+ facevalue.toString()+valueDate.getTime()+','+lastCouponDate.getTime()).replaceAll('"','')
        switch (coupon[0]['currency']) {
          case 810:
            coupon_data.accuredInterest = (coupon_data.currentCouponAmount*qty).toFixed(2);
          break;
          default:
            coupon_data.accuredInterest = (facevalue*qty*coupon[0]['couponrate']/100*coupon_data.days/365).toFixed(2);
          break;
        }
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
    return this.subjectCorpData.asObservable(); 
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
