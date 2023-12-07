import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, map, tap } from 'rxjs';
import { AccountsTableModel, accountTypes, ClientData, InstrumentData, PortfolioPerformnceData, portfolioPositions, StrategiesGlobalData, StrategyStructure } from '../models/intefaces.model';

@Injectable({
  providedIn: 'root'
})
export class AppInvestmentDataServiceService {

  constructor(private http:HttpClient) { }
  
  private subjectName = new Subject<any>(); 
  private subjectReloadStrategyStructure = new Subject<any>(); 
  private subjectReloadPortfoliosData = new Subject<any>(); 
  private subjectReloadClientTable = new Subject<ClientData[]>(); 
  private subjectClientsPortfolios = new Subject<{id:number,code:string}[]>(); 
  private subjectPerformanceData = new Subject<PortfolioPerformnceData[]>(); 
  
  getPortfoliosData (accountType:string, idportfolio: number, clientId: number, strategyMpName: string, action:string, accessToClientData:string='none'):Observable <AccountsTableModel[]> {
    const params = {
      accountType: accountType,
      idportfolio: idportfolio,
      clientId: clientId, 
      strategyMpName :strategyMpName, 
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
  sendClientsPortfolios (portfolios: {id:number,code:string}[]) {
    this.subjectClientsPortfolios.next(portfolios);
  }
  getClientsPortfolios ():Observable <{id:number,code:string}[]> {
    return this.subjectClientsPortfolios.asObservable()
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
    return this.http.get <string[][]> ('/api/AAM/GetStrategyStructure/',{ params: params } ).pipe(
      map(data=> data[0]['array_agg']),
      tap (d=>console.log('new',d))
    )
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
  getPortfolioPerformnceData (
    params_data?: {
      p_portfolios_list : string[], 
      p_report_date_start: string, 
      p_report_date_end:string, 
      p_report_currency :number 
    } ):Observable<PortfolioPerformnceData[]> {
      params_data = params_data? params_data : {
        p_portfolios_list:['ACM002','ICM011','VPC005'],
        p_report_date_start:'11/05/23', 
        p_report_date_end: '12/05/23',
        p_report_currency:840
    }
    return this.http.post <PortfolioPerformnceData[]> ('/api/AAM/GetPortfolioAnalytics/',
    {
      params:params_data
      /* {
        p_portfolios_list:['ACM002','ICM011','VPC005'],
        p_report_date_start:'02/01/23', 
        p_report_date_end: '12/05/23',
        p_report_currency:840
      } */,
      action:'getPortfolioPerformnceData',
      order:' portfolioname, report_date'})
  }
  recievePerformnceData(): Observable<PortfolioPerformnceData[]> { 
    return this.subjectPerformanceData.asObservable(); 
  }
  sendPerformnceData (data: PortfolioPerformnceData[]) {
    this.subjectPerformanceData.next(data);
  }
}
