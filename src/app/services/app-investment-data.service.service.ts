import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { StrategiesGlobalData, StrategyStructure } from '../models/accounts-table-model';

@Injectable({
  providedIn: 'root'
})
export class AppInvestmentDataServiceService {

  constructor(private http:HttpClient) { }
  getGlobalStategiesList (id:number, Name:string, action:string) : Observable <StrategiesGlobalData[]>  {
    const params = {'id': id, 'Name' :Name, 'action':action }
    return this.http.get <StrategiesGlobalData[]> ('/api/AAM/GetStrategiesList/',{ params: params } )
  }
  getStrategyData(client: number, clientname: string, action: string) : Observable <StrategiesGlobalData[]>  {
    const params = {'client': client, 'clientname' :clientname, 'action':action }
    return this.http.get <StrategiesGlobalData[]> ('/api/AAM/ClientData/', { params: params } )
  }

  getStrategyStructure (id: number, Name: string, action: string) : Observable <StrategyStructure[]>  {
    const params = {'id': id, 'Name' :Name, 'action':action }
    return this.http.get <StrategyStructure[]> ('/api/AAM/GetStrategyStructure/', { params: params } )
  }

  updateStrategy (data:any) { 
    return this.http.post ('/api/AAM/StrategyDataEdit/',{'data': data}).toPromise()
  }
  deleteStrategy (id:string) {
    console.log('delete', 'dlient');
    return this.http.post ('/api/AAM/ClientDataDelete/',{'idclient': id}).toPromise()
  }
  createStrategy (data:any) { 
    return this.http.post ('/api/AAM/ClientDataCreate/',{'data': data}).toPromise()
  }
}
