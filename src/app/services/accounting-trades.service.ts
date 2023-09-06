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
    bcEntryParameters={...bcEntryParameters,entryType:entryType,cSchemeGroupId:cSchemeGroupId}
    return this.http.get <bcTransactionType_Ext[]> ('/api/DEA/GetEntryScheme/',{params: bcEntryParameters})
  }
}
