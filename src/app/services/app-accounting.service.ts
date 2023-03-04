import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject} from 'rxjs';
import { bAccounts, bcTransactionType_Ext, SWIFTSGlobalListmodel, SWIFTStatement950model } from '../models/accounts-table-model';

@Injectable({
  providedIn: 'root'
})
export class AppAccountingService {
  constructor(private http:HttpClient) { }
  private subjectName = new Subject<any>(); 

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
  GetAccountData (currencyCode: number, id: number, clientId:number, accountNo: string, Action: string):Observable <bAccounts[]> {
    const params = {'currencyCode': currencyCode, 'id' :id, 'clientId': clientId,'accountNo':accountNo, 'Action': Action}
    return this.http.get <bAccounts []>('/api/DEA/fGetAccountingData/', { params: params })
  }
  EntryCreate ():Observable <any[]> {
    console.log('ftEntryCreate','ftEntryCreate');
    return this.http.get <any []>('/api/DEA/ftEntryCreate/')
  }
  
  GetEntryScheme (bcEntryParameters:any) :Observable <bcTransactionType_Ext[]> { 
    return this.http.get <bcTransactionType_Ext []>('/api/DEA/GetEntryScheme/', { params: bcEntryParameters })  
  } 
  sendEntryDraft (data: any) { this.subjectName.next(data);}
  getEntryDraft (): Observable<any> {return this.subjectName.asObservable(); }

  CreateEntryAccountingInsertRow (data:any) { 
    return this.http.post ('/api/DEA/fCreateEntryAccountingInsertRow/',{'data': data}).toPromise()
  } 
  GetAccountsEntriesListAccounting (dataRange: string, id: number, MTType:string, Sender: string, Action: string):Observable <SWIFTStatement950model[]> {
    const params = {'dataRange': dataRange, 'id' :id, 'MTType': MTType,'Sender':Sender, 'Action': Action}
    return this.http.get <SWIFTStatement950model []>('/api/DEA/fGetMT950Transactions/', { params: params })
  }

}
