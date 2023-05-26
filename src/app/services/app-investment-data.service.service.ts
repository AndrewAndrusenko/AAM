import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { AccountsTableModel, accountTypes, ClientData, InstrumentData, StrategiesGlobalData, StrategyStructure } from '../models/intefaces';

@Injectable({
  providedIn: 'root'
})
export class AppInvestmentDataServiceService {

  constructor(private http:HttpClient) { }
  
  private subjectName = new Subject<any>(); 
  private subjectReloadStrategyStructure = new Subject<any>(); 
  private subjectReloadPortfoliosData = new Subject<any>(); 

  getPortfoliosData (accountType:string, idportfolio: number, clientId: number, strategyId: number, action:string, accessToClientData:string='none'):Observable <AccountsTableModel[]> {
    const params = {
      accountType: accountType,
      idportfolio: idportfolio,
      clientId: clientId, 
      strategyId :strategyId, 
      actionOnAccountTable: action,
      accessToClientData:accessToClientData
    }
    return this.http.get <AccountsTableModel []>('/api/AAM/portfolioTable/', { params: params })
  }
  sendReloadPortfoliosData (data:any) { 
    this.subjectReloadPortfoliosData.next(data); 
  }
  getReloadPortfoliosData(): Observable<any> { 
    return this.subjectReloadPortfoliosData.asObservable(); 
  }
  getInstrumentData (secid: string): Observable <InstrumentData[]>  {
    const params = {'secid': secid}
    return this.http.get <InstrumentData[]> ('/api/AAM/InstrumentData/',{ params: params } )
  }
  getClientData (client: number, clientname: string, action: string) : Observable <ClientData[]>  {
    const params = {'client': client, 'clientname' :clientname, 'action':action }
    return this.http.get <ClientData[]> ('/api/AAM/ClientData/', { params: params } )
  }
  updateClient (data:any) :Observable<ClientData[]>  { 
    return this.http.post <ClientData[]> ('/api/AAM/ClientDataEdit/',{'data': data})
  }
  deleteClient (id:string): Observable<ClientData[]> {
    return this.http.post <ClientData[]> ('/api/AAM/ClientDataDelete/',{'idclient': id})
  }
  createClient (data:any): Observable<ClientData[]>  { 
    return this.http.post <ClientData[]> ('/api/AAM/ClientDataCreate/',{'data': data})
  }
  sendReloadStrategyStructure ( id:number) { 
    this.subjectReloadStrategyStructure.next(id);
  }
  getReloadStrategyStructure(): Observable<any> { 
    return this.subjectReloadStrategyStructure.asObservable(); 
  }
  sendReloadStrategyList ( id:any) { 
    this.subjectName.next(id);
  }
  getReloadStrategyList(): Observable<any> {
    return this.subjectName.asObservable(); 
  }
  getGlobalStategiesList (id:number, Name:string, action:string) : Observable <StrategiesGlobalData[]>  {
    const params = {'id': id, 'Name' :Name, 'action':action }
    return this.http.get <StrategiesGlobalData[]> ('/api/AAM/GetStrategiesList/',{ params: params } )
  }
  getAccountTypesList (id:number, Name:string, action:string) : Observable <accountTypes[]>  {
    const params = {'id': id, 'Name' :Name, 'action':action }
    return this.http.get <accountTypes[]> ('/api/AAM/GetStrategiesList/',{ params: params } )
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
  
  createAccount (data:any) { 
    return this.http.post ('/api/AAM/AccountCreate/',{'data': data}).toPromise()
  } 
  deleteAccount (id:string) { 
    return this.http.post ('/api/AAM/AccountDelete/',{'id': id}).toPromise()
  } 
  updateAccount (data:any) { 
    return this.http.post ('/api/AAM/AccountEdit/',{'data': data}).toPromise()
  }
  
}
