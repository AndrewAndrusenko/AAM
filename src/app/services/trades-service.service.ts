import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { allocation, orders, trades } from '../models/interfaces.model';
interface SearchParameters{
  type?:string,
  secidList?: string[],
  portfoliosList?: string[],
  tdate? : string,
  id_bulk_order?:number,
  price?:number,
  qty?:number
  status?:string[],
  idportfolio?:number
}
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
  private reloadTradeTable = new Subject < {data: trades[], action:string}> (); 
  private reloadOrdersTable = new Subject < {data: orders[], action:string}> (); 
  private reloadExecution = new Subject <{data:orders[],idtrade:number,ordersForExecution:number[]}> (); 
  private updateOrdersStatus = new Subject <{data:orders[],bulksForUpdate:number[]}>(); 
  private allocationDeleted = new Subject <allocation[]>(); 
  private sAllocatedQty = new Subject <{idtrade:number,allocatedqty:number}>(); 
  private sOrdersAllocated = new BehaviorSubject <number[]>([]); 
  updateTrade(data:trades, action:string):Observable <trades[]> {
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
  getTradeInformation(serachFilters:{idtrade?:number}|null):Observable<trades[]> {
    let params = {...serachFilters,action:'getTradeInformation'}
    return this.http.get <trades[]> ('api/AAM/MD/getTradeData/',{params:params})
  }
  getTradeDetails(idtrade:number):Observable<trades[]> {
    return this.http.get <trades[]> ('api/AAM/MD/getTradeData/',{params:{idtrade:idtrade,action:'f_i_get_trade_details'}})
  }
  sendOrderDataToUpdateTableSource ( data:orders[], action: string) {
    let dataSet = {
      data: data,
      action:action
    }
    this.reloadOrdersTable.next(dataSet); 
  }
  getOrderDataToUpdateTableSource(): Observable<ordersDataSet> { 
    return this.reloadOrdersTable.asObservable(); 
  }
  getOrderInformation(serachFilters:SearchParameters):Observable<orders[]> {
    let params = {...serachFilters}
    return this.http.get <orders[]> ('api/AAM/MD/getOrderData/',{params:params})
  }
  getBulkOrderDetails(id_bulk_order:number):Observable<orders[]> {
    return this.http.get <orders[]> ('api/AAM/MD/getOrderData/',{params:{id_bulk_order:id_bulk_order,action:'f_i_get_bulk_order_details'}})
  }
  createOrderbyMP (params_data: {secidList:string[], idportfolios : number[], report_date: string, report_id_currency :number }):Observable<orders[]>  {
    return this.http.post <orders[]>('api/AAM/MD/createOrderbyMP/',{params:params_data,action:'createOrderbyMP'})
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
  getDraftExecuteOrders (ordersForExecution:number[],qtyForAllocation:number,tradeId:number):Observable<orders[]>{
    let data={ordersForExecution:ordersForExecution,qtyForAllocation:qtyForAllocation,tradeId:tradeId}
    return this.http.post <orders[]>('api/AAM/MD/Allocation',{data:data,action:'getDraftExecuteOrders'})
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
  getAllocationInformation(serachFilters:SearchParameters,FirstOpenedAccountingDate:string,balances:boolean=false,secid:string):Observable<allocation[]> {
    let params = {...serachFilters,
      action:'getAllocationTrades',
      secid:secid,
      firstOpenedAccountingDate:FirstOpenedAccountingDate,
      balances:balances}
    return this.http.get <allocation[]> ('api/AAM/MD/getTradeData/',{params:params});    
  }
  getEntriesPerAllocatedTrade (p_trades_to_check:number[]):Observable<{idtrade: number,entries_qty: number}[]> {
    let params = {
      action:'get_qty_entries_per_allocated_trade',
      p_trades_to_check:p_trades_to_check.length===1? [...p_trades_to_check,...p_trades_to_check] : p_trades_to_check

    }
    return this.http.get <{idtrade: number,entries_qty: number}[]> ('api/AAM/MD/getTradeData/',{params:params});    
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
