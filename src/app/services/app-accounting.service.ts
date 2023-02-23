import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable} from 'rxjs';
import { SWIFTSGlobalListmodel, SWIFTStatement950model } from '../models/accounts-table-model';

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

}
