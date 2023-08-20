import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { couponPeriodInfo, orders, trades } from '../models/intefaces.model';
import { number } from 'echarts';
import { Action } from 'rxjs/internal/scheduler/Action';
interface tradesDataSet {
  data:trades[],
  action:string
}
interface ordersDataSet {
  data:orders[],
  action:string
}
interface bulkModifedSet {
  id:number,
  action:string,
  ordertype:string
}
@Injectable({
  providedIn: 'root'
})
export class AppTradeService {
  updateTrade(data:any, action:string):Observable <trades[]> {
    return this.http.post <trades[]> ('api/AAM/MD/UpdateTradeData/',{data:data,action:action})
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
  getTradeDataToUpdateTableSource(): Observable<tradesDataSet> { 
    return this.reloadTradeTable.asObservable(); 
  }
  getTradeInformation(serachFilters:any):Observable<trades[]> {
    let params = {...serachFilters}
    return this.http.get <trades[]> ('api/AAM/MD/getTradeData/',{params:params})
  }
  sendOrderDataToUpdateTableSource ( data:orders[], action: string) {
    let dataSet = {
      data: data,
      action:action
    }
    this.reloadTradeTable.next(dataSet); 
  }
  getOrderDataToUpdateTableSource(): Observable<ordersDataSet> { 
    return this.reloadTradeTable.asObservable(); 
  }
  getOrderInformation(serachFilters:any):Observable<orders[]> {
    let params = {...serachFilters}
    return this.http.get <orders[]> ('api/AAM/MD/getOrderData/',{params:params})
  }
  unmergerBulkOrder (bulkOrders:number[]) :Observable<bulkModifedSet[]> {
    return this.http.post <bulkModifedSet[]>('api/AAM/MD/ModifyBulkOrder',{bulkOrders:bulkOrders,action:'unmergerBulkOrder'})
  }
  createBulkOrder (clientOrders:number[]) :Observable<bulkModifedSet[]> {
    return this.http.post <bulkModifedSet[]>('api/AAM/MD/ModifyBulkOrder',{clientOrders:clientOrders,action:'createBulkOrder'})
  }
}
