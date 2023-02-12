import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { StrategiesGlobalData, StrategyStructure } from '../models/accounts-table-model';

@Injectable({
  providedIn: 'root'
})
export class AppInvestmentDataServiceService {

  constructor(private http:HttpClient) { }
  
  private subjectName = new Subject<any>(); 

  sendReloadStrategyStructure ( id:number) { //the component that wants to update something, calls this fn
    this.subjectName.next(id); //next() will feed the value in Subject
  }

  geReloadStrategyStructure(): Observable<any> { //the receiver component calls this function 
    return this.subjectName.asObservable(); //it returns as an observable to which the receiver funtion will subscribe
  }

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
  
  createStrategy (data:any) { 
    return this.http.post ('/api/AAM/StrategyGlobalDataCreate/',{'data': data}).toPromise()
  }
  deleteStrategy (id:string) {
    return this.http.post ('/api/AAM/StrategyGlobalDataDelete/',{'id': id}).toPromise()
  }
  updateStrategy (data:any) { 
    return this.http.post ('/api/AAM/StrategyDataEdit/',{'data': data}).toPromise()
  }


  createStrategyStructure (data:any) { 
    return this.http.post ('/api/AAM/StrategyStructureCreate/',{'data': data}).toPromise()
  } 
  deleteStrategyStructure (id:string) { 
    return this.http.post ('/api/AAM/StrategyStructureDelete/',{'id': id}).toPromise()
  } 
  updateStrategyStructure (data:any) { 
    return this.http.post ('/api/AAM/StrategyStructureEdit/',{'data': data}).toPromise()
  }
  
}
