import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { AccountsTableModel, accountTypes, ClientData, InstrumentData, portfolioPositions, StrategiesGlobalData, StrategyStructure } from '../models/intefaces.model';

@Injectable({
  providedIn: 'root'
})
export class AppInvestmentDataServiceService {

  constructor(private http:HttpClient) { }
  
  private subjectName = new Subject<any>(); 
  private subjectReloadStrategyStructure = new Subject<any>(); 
  private subjectReloadPortfoliosData = new Subject<any>(); 
  private subjectReloadClientTable = new Subject<ClientData[]>(); 
  
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
  sendReloadClientTable ( data:ClientData[]) { 
    this.subjectReloadClientTable.next(data);
  }
  getReloadClientTable(): Observable<ClientData[]> { 
    return this.subjectReloadClientTable.asObservable(); 
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
  getPortfoliosListForMP ( Name:string, action:string) : Observable <string[]>  {
    const params = {'Name' :Name, 'action':action }
    return this.http.get <string[]> ('/api/AAM/GetStrategyStructure/',{ params: params } )
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
  
  createStrategy (data:any):Observable <StrategiesGlobalData[]> { 
    return this.http.post <StrategiesGlobalData[]> ('/api/AAM/StrategyGlobalDataCreate/',{'data': data})
  }
  deleteStrategy (id:string):Observable <StrategiesGlobalData[]> {
    return this.http.post <StrategiesGlobalData[]> ('/api/AAM/StrategyGlobalDataDelete/',{'id': id})
  }
  updateStrategy (data:any):Observable <StrategiesGlobalData[]> { 
    return this.http.post <StrategiesGlobalData[]> ('/api/AAM/StrategyDataEdit/',{'data': data})
  }
  createStrategyStructure (data:any):Observable <StrategyStructure[]> { 
    return this.http.post <StrategyStructure[]> ('/api/AAM/StrategyStructureCreate/',{'data': data})
  } 
  deleteStrategyStructure (id:string):Observable <StrategyStructure[]> { 
    return this.http.post <StrategyStructure[]> ('/api/AAM/StrategyStructureDelete/',{'id': id})
  } 
  updateStrategyStructure (data:any):Observable <StrategyStructure[]> { 
    return this.http.post <StrategyStructure[]> ('/api/AAM/StrategyStructureEdit/',{'data': data})
  }
  createAccount (data:any) { 
    return this.http.post <AccountsTableModel[]> ('/api/AAM/AccountCreate/',{'data': data})
  } 
  deleteAccount (id:string) { 
    return this.http.post <AccountsTableModel[]> ('/api/AAM/AccountDelete/',{'id': id})
  } 
  updateAccount (data:any) { 
    return this.http.post <AccountsTableModel[]> ('/api/AAM/AccountEdit/',{'data': data})
  }
  getPortfoliosPositions (params_data: {secidList:string[], idportfolios : number[], report_date: string, report_id_currency :number }):Observable<portfolioPositions[]> {
    return this.http.post <portfolioPositions[]> ('/api/AAM/GetPortfolioPositions/',{params:params_data,action:'getPortfolioPositions'})
  }
}
