import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { StrategiesGlobalData } from '../models/accounts-table-model';

@Injectable({
  providedIn: 'root'
})
export class AppInvestmentDataServiceService {

  constructor(private http:HttpClient) { }
  getGlobalStategiesList (client:number, clientname:string, action:string) : Observable <StrategiesGlobalData[]>  {
    const params = {'client': client, 'clientname' :clientname, 'action':action }
    return this.http.get <StrategiesGlobalData[]> ('/api/AAM/GetStrategiesList/',{ params: params } )
  }
}
