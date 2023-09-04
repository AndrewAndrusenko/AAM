import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { bcParametersSchemeAccTrans, bcTransactionType_Ext } from '../models/intefaces.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AccountingTradesService {

  constructor( private http:HttpClient) { }
  getAccountingScheme(bcEntryParameters:any,cSchemeGroupId:string, entryType:string='AL'):Observable<bcTransactionType_Ext[]> {
    // let bcEntryParameters = <bcParametersSchemeAccTrans> {}
    bcEntryParameters.cSchemeGroupId=cSchemeGroupId;
    bcEntryParameters.id_settlement_currency=840;
    bcEntryParameters.id_settlement_currency=840;
    bcEntryParameters.cptyCode='CHASUS';
    bcEntryParameters.pDate_T='9/1/2023';
    bcEntryParameters.pAccountId=1;
    bcEntryParameters.pSettlementAmount=2000;
    bcEntryParameters.secid='GGOG_RM';
    bcEntryParameters.allocated_trade_id=10;
    bcEntryParameters.idtrade=102;
    bcEntryParameters.entryType=entryType;
    return this.http.get <bcTransactionType_Ext[]> ('/api/DEA/GetEntryScheme/',{params: bcEntryParameters})
  }
}
