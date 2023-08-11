import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { couponPeriodInfo, trades } from '../models/intefaces.model';
interface TradesDataSet {
  data:trades[],
  action:string
}
@Injectable({
  providedIn: 'root'
})
export class AppTradeService {
  updateInstrument(value: any):Observable <trades[]> {
    return this.http.post <trades[]> ('api/AAM/MD/getTradeData/',value)
  }
  constructor(private http:HttpClient) { }
  private reloadTradeTable = new Subject <any> (); 
  sendTradeDataToUpdateTableSource ( data:trades[], action: string) {
    let dataSet = {
      data: data,
      action:action
    }
    this.reloadTradeTable.next(dataSet); 
  }
  getTradeDataToUpdateTableSource(): Observable<TradesDataSet> { 
    return this.reloadTradeTable.asObservable(); 
  }
  getTradeInformation(serachFilters:any):Observable<trades[]> {
    let params = {...serachFilters}
    return this.http.get <trades[]> ('api/AAM/MD/getTradeData/',{params:params})
  }

}
