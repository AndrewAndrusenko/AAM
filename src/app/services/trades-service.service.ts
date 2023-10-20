import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { allocation, orders, trades } from '../models/intefaces.model';
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
  constructor(private http:HttpClient) { }
  private reloadTradeTable = new Subject <any> (); 
  private reloadExecution = new Subject <{data:orders[],idtrade:number,ordersForExecution:number[]}> (); 
  private updateOrdersStatus = new Subject <{data:orders[],bulksForUpdate:number[]}>(); 
  private allocationDeleted = new Subject <allocation[]>(); 
  private sAllocatedQty = new Subject <{idtrade:number,allocatedqty:number}>(); 
  private sOrdersAllocated = new BehaviorSubject <number[]>([]); 
  updateTrade(data:any, action:string):Observable <trades[]> {
    return this.http.post <trades[]> ('api/AAM/MD/UpdateTradeData/',{data:data,action:action})
  }
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
    let params = {...serachFilters,action:'getTradeInformation'}
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
  deleteOrders (clientOrders:number[]) :Observable<bulkModifedSet[]> {
    return this.http.post <bulkModifedSet[]>('api/AAM/MD/ModifyBulkOrder',{clientOrders:clientOrders,action:'deleteClientOrders'})
  }
  createBulkOrder (clientOrders:number[]) :Observable<bulkModifedSet[]> {
    return this.http.post <bulkModifedSet[]>('api/AAM/MD/ModifyBulkOrder',{clientOrders:clientOrders,action:'createBulkOrder'})
  }
  changeOrderStatus (newStatus:string, ordersToUpdate:number[]) {
    return this.http.post <orders[]> ('api/AAM/MD/ModifyBulkOrder/',{newStatus:newStatus,ordersToUpdate:ordersToUpdate,action:'ordersStatusChange'})
  }
  executeOrders (ordersForExecution:number[],qtyForAllocation:number,tradeId:number):Observable<orders[]>{
    let data={ordersForExecution:ordersForExecution,qtyForAllocation:qtyForAllocation,tradeId:tradeId}
    return this.http.post <orders[]>('api/AAM/MD/Allocation',{data:data,action:'executeOrders'})
  }
  sendReloadOrdersForExecution (data:orders[],idtrade:number,ordersForExecution:number[]) {
    this.reloadExecution.next({data:data,idtrade:idtrade,ordersForExecution:ordersForExecution});
  }
  getReloadOrdersForExecution ():Observable<{data:orders[],idtrade:number,ordersForExecution:number[]}> {
    return this.reloadExecution.asObservable();
  }
  sendUpdateOrdersChangedStatus (updatedOrders:orders[],bulksForUpdate:number[]) {
    this.updateOrdersStatus.next({data:updatedOrders,bulksForUpdate:bulksForUpdate});
  }
  getUpdateOrdersChangedStatus ():Observable<{data:orders[],bulksForUpdate:number[]}> {
    return this.updateOrdersStatus.asObservable();
  }
  getAllocationInformation(serachFilters:any,FirstOpenedAccountingDate:string,balances:boolean=false,secid:string):Observable<allocation[]> {
    let params = {...serachFilters,
      action:'getAllocationTrades',
      secid:secid,
      firstOpenedAccountingDate:FirstOpenedAccountingDate,
      balances:balances}
    return this.http.get <allocation[]> ('api/AAM/MD/getTradeData/',{params:params});    
  }
  deleteAllocatedTrades(tradesIDs:number[]){
    let data={tradesIDs:tradesIDs};
    return this.http.post<allocation[]> ('api/AAM/MD/Allocation',{data:data,action:'deleteAllocation'})
  }
  sendDeletedAllocationTrades (tradesIDs:allocation[]) {
    this.allocationDeleted.next(tradesIDs);
  }
  getDeletedAllocationTrades ():Observable<allocation[]> {
    return this.allocationDeleted.asObservable();
  }
  sendNewAllocatedQty (data:{idtrade:number,allocatedqty:number}) {
    this.sAllocatedQty.next(data);
  }
  getNewAllocatedQty ():Observable<{idtrade:number,allocatedqty:number}> {
    return this.sAllocatedQty.asObservable();
  }
  sendAllocatedOrders (ordersAllocated:number[]) {
    this.sOrdersAllocated.next(ordersAllocated);
  }
  getAllocatedOrders ():Observable<number[]> {
    return this.sOrdersAllocated.asObservable();
  }

}
