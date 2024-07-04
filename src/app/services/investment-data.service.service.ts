import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, map, tap } from 'rxjs';
import { AccountsTableModel, accountTypes, ClientData, InstrumentData, NPVDynamicData, PortfolioPerformnceData, portfolioPositions, PortfoliosHistory, RevenueFactorData, StrategiesGlobalData, StrategyStructure, StrategyStructureHistory } from '../models/interfaces.model';

@Injectable({
  providedIn: 'root'
})
export class AppInvestmentDataServiceService {

  constructor(private http:HttpClient) { }
  
  private subjectName = new Subject<number>(); 
  private subjectReloadStrategyStructure = new Subject<number>(); 
  private subjectReloadPortfoliosData = new Subject<boolean>(); 
  private subjectReloadClientTable = new Subject<ClientData[]>(); 
  private subjectClientsPortfolios = new Subject<{id:number,code:string}[]>(); 
  private subjectPerformanceData = new Subject<{data: PortfolioPerformnceData[],currencySymbol:string,showChart:boolean}>(); 
  private subjectRevenueFactorData = new Subject<{data: RevenueFactorData[],currencySymbol:string,showChart:boolean}>(); 
  private subjectSummaryPortfolioData = new Subject<{npv:number,managementFee:number,perfomanceFee:number,PnL:number}>(); 
  private subjectHistoricalPortfolio = new Subject<Map <string,StrategyStructureHistory>>(); 
  
  getPortfoliosData (accountType:string, idportfolio: number, clientId: number, strategyMpName: string, action:string, idFeeMain:number,accessToClientData:string='none'):Observable <AccountsTableModel[]> {
    const params = {
      accountType: accountType,
      idportfolio: idportfolio,
      clientId: clientId, 
      strategyMpName :strategyMpName, 
      actionOnAccountTable: action,
      accessToClientData:accessToClientData,
      idFeeMain:idFeeMain
    }
    return this.http.get <AccountsTableModel []>('/api/AAM/portfolioTable/', { params: params })
  }
  sendReloadPortfoliosData (data:boolean) { 
    this.subjectReloadPortfoliosData.next(data); 
  }
  getReloadPortfoliosData(): Observable<boolean> { 
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
  updateClient (data:ClientData) :Observable<ClientData[]>  { 
    return this.http.post <ClientData[]> ('/api/AAM/ClientDataEdit/',{'data': data})
  }
  deleteClient (id:string): Observable<ClientData[]> {
    return this.http.post <ClientData[]> ('/api/AAM/ClientDataDelete/',{'idclient': id})
  }
  createClient (data:ClientData): Observable<ClientData[]>  { 
    return this.http.post <ClientData[]> ('/api/AAM/ClientDataCreate/',{'data': data})
  }
  sendReloadStrategyStructure ( id:number) { 
    this.subjectReloadStrategyStructure.next(id);
  }
  getReloadStrategyStructure(): Observable<number> { 
    return this.subjectReloadStrategyStructure.asObservable(); 
  }
  sendReloadStrategyList ( id:number) { 
    this.subjectName.next(id);
  }
  getReloadStrategyList(): Observable<number> {
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
  getStrategyStructureHistory (p_id_strategy_parent:number) : Observable <StrategyStructureHistory[]>  {
    return this.http.get <StrategyStructureHistory[]> (
      '/api/AAM/GetStrategyStructure/', 
      {params:  {p_id_strategy_parent:p_id_strategy_parent, action:'getStrategyStructureHistory'}})
  }
  getPortfoliosHistory (searchParams:{p_type:number[]|null,  p_idportfolio:number|null, p_user_id:number|null, p_tr_date:string|null}) : Observable <PortfoliosHistory[]>  {
    return this.http.get <PortfoliosHistory[]> (
      '/api/AAM/PortfolioData/', 
      {params:  {...searchParams, action:'getPortfoliosHistory'}})
  }
  sendStrategyStructureHistoryPortfolio (historicalPortfolio: Map <string,StrategyStructureHistory>) {
    this.subjectHistoricalPortfolio.next(historicalPortfolio);
  }
  receiveStrategyStructureHistoryPortfolio ():Observable<Map <string,StrategyStructureHistory>> {
    return this.subjectHistoricalPortfolio.asObservable()
  }
  updateStrategy (data:StrategiesGlobalData,action:string):Observable <StrategiesGlobalData[]> { 
    return this.http.post <StrategiesGlobalData[]> ('/api/AAM/StrategyDataUpdate/',{data:data, action:action})
  }
  updateStrategyStructure (data:StrategyStructure,action:string):Observable <StrategyStructure[]> { 
    return this.http.post <StrategyStructure[]> ('/api/AAM/updateStrategyStructure/',{data:data, action:action})
  }
  updateAccount (data:ClientData,action:string):Observable<AccountsTableModel[]> { 
    return this.http.post <AccountsTableModel[]> ('/api/AAM/AccountEdit/',{data:data, action:action})
  }
  getPortfoliosPositions (params_data: {secidList:string[], idportfolios : number[], report_date: string, report_id_currency :number }):Observable<portfolioPositions[]> {
    return this.http.post <portfolioPositions[]> ('/api/AAM/GetPortfolioPositions/',{params:params_data,action:'getPortfolioPositions'})
  }
  getSecIDsPositions (params_data: {report_date: string, report_id_currency :number,secid :string }):Observable<portfolioPositions[]> {
    return this.http.post <portfolioPositions[]> ('/api/AAM/GetPortfolioPositions/',{params:params_data,action:'getSecIDsPositions'})
  }
  getPortfolioMpDeviations (params_data: {secidList:string[], idportfolios : number[], report_date: string, report_id_currency :number }):Observable<portfolioPositions[]> {
    return this.http.post <portfolioPositions[]> ('/api/AAM/GetPortfolioPositions/',{params:params_data,action:'getPortfolioMpDeviations'})
  }
  getPortfolioPerformnceData (
    params_data?: {
      p_portfolios_list : string[], 
      p_report_date_start: string, 
      p_report_date_end:string, 
      p_report_currency :number 
    } ):Observable<PortfolioPerformnceData[]> {
      params_data = params_data?   params_data : {
        p_portfolios_list:['ACM002','ICM011','VPC005'],
        p_report_date_start:'11/05/23', 
        p_report_date_end: '12/05/23',
        p_report_currency:840
    };
    return this.http.post <PortfolioPerformnceData[]> ('/api/AAM/GetPortfolioAnalytics/',
    {
      params:params_data,
      action:'getPortfolioPerformnceData',
      order:' portfolioname, report_date'
    })
  }
  getNPVDynamic (
    params_data?: {
      p_portfolios_list : string[], 
      p_report_date_start: string, 
      p_report_date_end:string, 
      p_report_currency :number 
    } ):Observable<NPVDynamicData[]> {
      params_data = params_data?   params_data : {
        p_portfolios_list:['ACM002','ICM011','VPC005'],
        p_report_date_start:'11/05/23', 
        p_report_date_end: '12/05/23',
        p_report_currency:840
    };
    return this.http.post <NPVDynamicData[]> ('/api/AAM/GetPortfolioAnalytics/',
    {
      params:params_data,
      action:'getNPVDynamic',
      order:' portfolioname, report_date,secid'
    })
  }
  recievePerformnceData(): Observable<{data: PortfolioPerformnceData[],currencySymbol:string,showChart:boolean}> { 
    return this.subjectPerformanceData.asObservable(); 
  }
  sendPerformnceData (dataSet:{data: PortfolioPerformnceData[],currencySymbol:string,showChart:boolean}) {
    this.subjectPerformanceData.next(dataSet);
  }
  getRevenueFactorData (
    params_data?: {
      p_portfolios_list : string[], 
      p_report_date_start: string, 
      p_report_date_end:string, 
      p_report_currency :number 
    } ):Observable<RevenueFactorData[]> {
      params_data = params_data?   params_data : {
        p_portfolios_list:['ACM002','ICM011','VPC005'],
        p_report_date_start:'11/05/23', 
        p_report_date_end: '12/05/23',
        p_report_currency:840
    };
    return this.http.post <RevenueFactorData[]> ('/api/AAM/GetPortfolioAnalytics/',
    {
      params:params_data,
      action:'getRevenueFactorData',
      order:' report_date, portfolioname, secid '
    })
  }
  recieveRevenueFactorData(): Observable<{data: RevenueFactorData[],currencySymbol:string,showChart:boolean}> { 
    return this.subjectRevenueFactorData.asObservable(); 
  }
  sendRevenueFactorData (dataSet:{data: RevenueFactorData[],currencySymbol:string,showChart:boolean}) {
    this.subjectRevenueFactorData.next(dataSet);
  }
  recieveSummaryPortfolioData(): Observable<{npv:number,managementFee:number,perfomanceFee:number,PnL:number}> { 
    return this.subjectSummaryPortfolioData.asObservable(); 
  }
  sendSummaryPortfolioData (dataSet:{npv:number,managementFee:number,perfomanceFee:number,PnL:number}) {
    this.subjectSummaryPortfolioData.next(dataSet);
  }
}
