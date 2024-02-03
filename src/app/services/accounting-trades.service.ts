import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { allocation_fifo, bcTransactionType_Ext } from '../models/interfaces.model';
import { Observable } from 'rxjs';
import { FifoTableData } from '../models/accountng-intefaces.model';
import { param } from 'jquery';
@Injectable({
  providedIn: 'root'
})
export class AccountingTradesService {

  constructor( private http:HttpClient) { }
  getAccountingScheme(bcEntryParameters:any,cSchemeGroupId:string, entryType:string='AL'):Observable<bcTransactionType_Ext[]> {
    bcEntryParameters={...bcEntryParameters,entryType:entryType,cSchemeGroupId:cSchemeGroupId}
    return this.http.get <bcTransactionType_Ext[]> ('/api/DEA/GetEntryScheme/',{params: bcEntryParameters})
  }
  /*----------------------FIFO----------------------------------------------------*/
  createFIFOtransactions (tradeType:number,idtrades:number[],idportfolio:number,secid:string,qty_to_sell:number,sell_price:number,id_sell_trade:number):Observable<allocation_fifo[]> {
    const params = {tr_type: tradeType,idtrades:idtrades,idportfolio:idportfolio,secid:secid,qty_to_sell:qty_to_sell,sell_price:sell_price, id_sell_trade:id_sell_trade}
    return this.http.post <allocation_fifo[]>('api/DEA/createFIFOtransactions/',{params:params})
  }
  deleteAccountingAndFIFOtransactions (idtrades:number[]):Observable<allocation_fifo[]> {
    const params = {idtrades:idtrades}
    return this.http.post <allocation_fifo[]>('api/DEA/deleteAccountingFIFOtransactions/',{params:params})
  }
  getFifoTableData (searchObj:any):Observable<FifoTableData[]> {
    console.log('search',searchObj);
    return this.http.get <FifoTableData[]>('api/DEA/getFIFOtransactions/',{params:searchObj})
  }
}
