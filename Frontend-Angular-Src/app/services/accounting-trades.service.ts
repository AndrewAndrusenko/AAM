import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { allocation_fifo } from '../models/interfaces.model';
import { Observable } from 'rxjs';
import { FifoPositions, FifoTableData } from '../models/accountng-intefaces.model';
@Injectable({
  providedIn: 'root'
})
export class AccountingTradesService {
  constructor( private http:HttpClient) { }
    /*----------------------FIFO----------------------------------------------------*/
  createFIFOtransactions (tradeType:number,idtrades:number[],idportfolio:number,secid:string,qty_to_sell:number,sell_price:number,id_sell_trade:number):Observable<allocation_fifo[]> {
    const params = {tr_type: tradeType,idtrades:idtrades,idportfolio:idportfolio,secid:secid,qty_to_sell:qty_to_sell,sell_price:sell_price, id_sell_trade:id_sell_trade}
    return this.http.post <allocation_fifo[]>('api/DEA/createFIFOtransactions/',{params:params})
  }
  deleteAccountingAndFIFOtransactions (idtrades:number[]):Observable<allocation_fifo[]> {
    const params = {idtrades:idtrades}
    return this.http.post <allocation_fifo[]>('api/DEA/deleteAccountingFIFOtransactions/',{params:params})
  }
  getFifoTableData (searchObj:{type:number,
    secidList: string[],
    portfoliosList:  string[],
    tradesIDs:  number[],
    tdate : string,
    id_bulk_order:null,
    price:string,
    qty:string}):Observable<FifoTableData[]> {
    return this.http.get <FifoTableData[]>('api/DEA/getFIFOtransactions/',{params:searchObj})
  }
  getFifoPositions (searchObj:{
    secidList: string[],
    portfoliosList: string [],
    tdate : string
  }):Observable<FifoPositions[]> {
    return this.http.get <FifoPositions[]> ('api/DEA/getFIFOPositions/',{params:searchObj})
  }
}
