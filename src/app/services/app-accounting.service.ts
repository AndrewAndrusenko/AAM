import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable} from 'rxjs';
import { bcTransactionType_Ext, SWIFTSGlobalListmodel, SWIFTStatement950model } from '../models/accounts-table-model';

@Injectable({
  providedIn: 'root'
})
export class AppAccountingService {
  constructor(private http:HttpClient) { }

  GetSWIFTsList (dataRange: string, id: number, MTType:string, Sender: string, Action: string):Observable <SWIFTSGlobalListmodel[]> {
    const params = {'dataRange': dataRange, 'id' :id, 'MTType': MTType,'Sender':Sender, 'Action': Action}
    return this.http.get <SWIFTSGlobalListmodel []>('/api/DEA/fGetMT950Transactions/', { params: params })
  }

  GetMT950Transactions (dataRange: string, id: number, MTType:string, Sender: string, Action: string):Observable <SWIFTStatement950model[]> {
    const params = {'dataRange': dataRange, 'id' :id, 'MTType': MTType,'Sender':Sender, 'Action': Action}
    return this.http.get <SWIFTStatement950model []>('/api/DEA/fGetMT950Transactions/', { params: params })
  }
  GetTransactionType_Ext (dataRange: string, id: number, MTType:string, Sender: string, Action: string):Observable <bcTransactionType_Ext[]> {
    const params = {'dataRange': dataRange, 'id' :id, 'MTType': MTType,'Sender':Sender, 'Action': Action}
    return this.http.get <bcTransactionType_Ext []>('/api/DEA/fGetAccountingData/', { params: params })
  }
 EntryCreate ():Observable <any[]> {
  console.log('ftEntryCreate','ftEntryCreate');
    return this.http.get <any []>('/api/DEA/ftEntryCreate/')
  }
  
  GetEntryScheme (bcEntryParameters:any) :Observable <bcTransactionType_Ext[]> { 
    console.log('GetEntryScheme', bcEntryParameters);
    return this.http.get <bcTransactionType_Ext []>('/api/DEA/GetEntryScheme/', { params: bcEntryParameters })  
  } 

}
