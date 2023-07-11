import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, ReplaySubject, Subject, observable} from 'rxjs';
import { bAccounts, bAccountsEntriesList, bBalanceData, bBalanceFullData, bcAccountType_Ext, bcEnityType, bcTransactionType_Ext, bLedger, bLedgerAccounts, bLedgerBalanceData, SWIFTSGlobalListmodel, SWIFTStatement950model } from '../models/intefaces';

@Injectable({
  providedIn: 'root'
})
export class AppAccountingService {
  constructor(private http:HttpClient) { }
  private subjectReloadAccontList = new Subject<any>();
  private subjectReloadLedgerAccontList = new Subject<any>();
  private subjectReloadBalanceSheet = new Subject<any>();
  private subjectFormState = new Subject<any>();
  private subjectEntryDraft = new Subject<any>();
  private subjectLoadedMT950Transactions = new Subject<any>();
  private relplaySubject = new ReplaySubject(1)
  AccountsEntriesList = <bAccountsEntriesList> {
    'd_transactionType': null,
    't_id': null,
    't_entryDetails':null,
    't_accountId': null, 
    't_ledgerNoId': null, 
    't_extTransactionId' : null, 
    't_dataTime': null,  
    't_amountTransaction': null, 
    't_XactTypeCode': null,  
    't_XactTypeCode_Ext': null, 
    'd_Debit' : null,  
    'd_Credit' : null,  
    'd_ledgerNo': null, 
    'd_accountNo': null,  
    'd_xActTypeCode_ExtName' : null, 
    'd_entryDetails': null, 
    'd_closingBalance': null, 
    'd_closingLedgerBalance': null 
  }
/* -----------------------Accountting ----------------------------------------------------- */

  GetSWIFTsList (dateMessage: string, id: number, MTType:string, Sender: string, Action: string):Observable <SWIFTSGlobalListmodel[]> {
    let params = {};
    let argName = null
    let argumentsNames = ['dateMessage', 'id', 'MTType', 'Sender', 'Action']
    for (let index = 0; index < arguments.length; index++) {
      argName = argumentsNames[index];
      arguments[index]==null? null: params[argName]= arguments[index]; 
    }
    return this.http.get <SWIFTSGlobalListmodel []>('/api/DEA/fGetMT950Transactions/', { params: params })
  }
  GetMT950Transactions (dataRange: string, id: number, MTType:string, Sender: string, Action: string):Observable <SWIFTStatement950model[]> {
   const params = {'dataRange': dataRange, 'id' :id, 'MTType': MTType,'Sender':Sender, 'Action': Action}
    return this.http.get <SWIFTStatement950model []>('/api/DEA/fGetMT950Transactions/', { params: params })
  }
  sendLoadedMT950Transactions ( id:any) {this.subjectLoadedMT950Transactions.next(id)}
  getLoadedMT950Transactions(): Observable<any> {return this.subjectLoadedMT950Transactions.asObservable()}

  GetTransactionType_Ext (dataRange: string, id: number, MTType:string, Sender: string, Action: string):Observable <bcTransactionType_Ext[]> {
    const params = {'dataRange': dataRange, 'id' :id, 'MTType': MTType,'Sender':Sender, 'Action': Action}
    return this.http.get <bcTransactionType_Ext []>('/api/DEA/fGetAccountingData/', { params: params })
  }
  GetEntityTypeList (dataRange: string, id: number, MTType:string, Sender: string, Action: string):Observable <bcEnityType[]> {
    const params = {'dataRange': dataRange, 'id' :id, 'MTType': MTType,'Sender':Sender, 'Action': Action}
    return this.http.get <bcEnityType []>('/api/DEA/fGetAccountingData/', { params: params })
  }
  GetAccountTypeList (dataRange: string, id: number, MTType:string, Sender: string, Action: string):Observable <bcAccountType_Ext[]> {
    const params = {'dataRange': dataRange, 'id' :id, 'MTType': MTType,'Sender':Sender, 'Action': Action}
    return this.http.get <bcAccountType_Ext []>('/api/DEA/fGetAccountingData/', { params: params })
  }
  GetAccountData (currencyCode: number, id: number, clientId:number, accountNo: string, Action: string,  queryCode?:string):Observable <bAccounts[]> {
    const params = {'currencyCode': currencyCode, 'id' :id, 'clientId': clientId,'accountNo':accountNo, 'Action': Action, queryCode: queryCode}
    return this.http.get <bAccounts []>('/api/DEA/fGetAccountingData/', { params: params })
  }
  GetLedgerData (currencyCode: number, id: number, clientId:number, accountNo: string, Action: string, queryCode?:string ):Observable <bLedger[]> {
    const params = {'currencyCode': currencyCode, 'id' :id, 'clientId': clientId,'accountNo':accountNo, 'Action': Action, queryCode: queryCode}
    return this.http.get <bLedger []>('/api/DEA/fGetAccountingData/', { params: params })
  }
  /*----------------------Create entry by scheme---------------------------------------------------------*/
  GetEntryScheme (bcEntryParameters:any) :Observable <bcTransactionType_Ext[]> { 
    return this.http.get <bcTransactionType_Ext []>('/api/DEA/GetEntryScheme/', { params: bcEntryParameters })  
  } 
  sendEntryDraft (data: any) { 
    this.GetbLastClosedAccountingDate(null,null,null,null,'GetbLastClosedAccountingDate').subscribe (OpenedDate => {
      let newEntryDraft = {}
      newEntryDraft['FirstOpenedAccountingDate'] = OpenedDate[0].FirstOpenedDate;
      let entryFormFields = Object.keys (this.AccountsEntriesList)
      // console.log('data.entryDraft)',data);
      Object.entries(data.entryDraft).forEach ((value,key) => {
        entryFormFields.includes('t_'+ value[0])? newEntryDraft['t_' + value[0]] = value[1]  : null;
        entryFormFields.includes('d_'+ value[0])? newEntryDraft['d_' + value[0]] = value[1] : null;
      })
      newEntryDraft['d_transactionType'] = 'AL';
      // newEntryDraft['id'] = 0
      data.entryDraft = newEntryDraft; 
      // this.subjectEntryDraft.forEach(el=>console.log('subjectEntryDraft next', data))
      this.subjectEntryDraft.next(data)
    })
  }
  getEntryDraft (): Observable<any> {return this.subjectEntryDraft.asObservable(); }
  sendFormState(formName: string, state: boolean) {this.subjectFormState.next({ formName: state })}
  getFormState(): Observable<any> {return this.subjectFormState.asObservable() }
  CreateEntryAccountingInsertRow (data:any) { return this.http.post ('/api/DEA/fCreateEntryAccountingInsertRow/',{'data': data})} 
  /*End------------------Create entry by scheme---------------------------------------------------------*/

  GetAccountsEntriesListAccounting (searchParameters:any, id: number, MTType:string, Sender: string, Action: string):Observable <bAccountsEntriesList[]> {
    let params = {'id' :id, 'MTType': MTType,'Sender':Sender, 'Action': Action};
    (searchParameters !== null) ?  params = {...params,...searchParameters}: null
    return this.http.get <bAccountsEntriesList []>('/api/DEA/fGetAccountingData/', { params: params })
  }
  GetAccountsListAccounting (currencyCode: number, id: number, clientId:number, accountNo: string, Action: string):Observable <bAccounts[]> {
    const params = {'currencyCode': currencyCode, 'id' :id, 'clientId': clientId,'accountNo':accountNo, 'Action': Action}
    return this.http.get <bAccounts []>('/api/DEA/fGetAccountingData/', { params: params })
  }
  GetLedgerAccountsListAccounting (currencyCode: number, id: number, clientId:number, accountNo: string, Action: string):Observable <bLedgerAccounts[]> {
    const params = {'currencyCode': currencyCode, 'id' :id, 'clientId': clientId,'accountNo':accountNo, 'Action': Action}
    return this.http.get <bLedgerAccounts []>('/api/DEA/fGetAccountingData/', { params: params })
  }
  GetbLastClosedAccountingDate (currencyCode: number, id: number, clientId:number, accountNo: string, Action: string):Observable <Date> {
    const params = {'currencyCode': currencyCode, 'id' :id, 'clientId': clientId,'accountNo':accountNo, 'Action': Action}
    return this.http.get <Date>('/api/DEA/fGetAccountingData/', { params: params })
  }
  GetbbalacedDateWithEntries (Action: string):Observable <Date[]> {
    const params = {'Action': Action}
    return this.http.get <Date[]>('/api/DEA/fGetAccountingData/', { params: params })
  }
  GetbAccountingDateToClose (Action: string):Observable <Date> {
    const params = {'Action': Action}
    return this.http.get <Date>('/api/DEA/fGetAccountingData/', { params: params })
  }
  GetbAccountingSumTransactionPerDate (balanceDate:string, Action: string):Observable <number> {
    const params = {'balanceDate': balanceDate,'Action': Action}
    return this.http.get <number>('/api/DEA/fGetAccountingData/', { params: params })
  }
  /*----------------------AccountsUI---------------------------------------------------------*/
  updateAccountAccounting (data:any, action:string):  Observable<bAccounts[]> { 
    return this.http.post <bAccounts[]> ('api/DEA/updateAccountAccounting/',{data:data, action:action})
  }
  sendReloadAccontList ( id:any) {this.subjectReloadAccontList.next(id)}
  getReloadAccontList(): Observable<any> {return this.subjectReloadAccontList.asObservable()}
/*----------------------LedgerAccountsUI----------------------------------------------------*/
  updateLedgerAccountAccounting (data:any, action:string):Observable<bLedger[]> {
    return this.http.post <bLedger[]>('/api/DEA/updateLedgerAccountAccounting/',{data:data, action:action})
  }
  sendReloadLedgerAccontList ( id:any) {this.subjectReloadLedgerAccontList.next(id)}
  getReloadLedgerAccontList(): Observable<any> { return this.subjectReloadLedgerAccontList.asObservable()}
/*----------------------EntryUI----------------------------------------------------*/
  updateEntryAccountAccounting (data:any, action:string):  Observable<any[]> { 
  return this.http.post <any[]> ('api/DEA/updateEntryAccountAccounting/',{data:data, action:action})
  }
  updateLLEntryAccountAccounting (data:any, action:string):  Observable<any[]> { 
  return this.http.post <any[]> ('api/DEA/updateLLEntryAccountAccounting/',{data:data, action:action})
  }
  sendReloadEntryList ( id:any) {this.relplaySubject.next(id)}
  getReloadEntryList(): Observable<any> {return this.relplaySubject.asObservable()}
/*----------------------OverdraftValidators----------------------------------------------------*/
  getExpectedBalanceOverdraftCheck (accountId: number, transactionAmount:number, transactionDate: string, xactTypeCode: number, id: number, FirstOpenedAccountingDate: string, Action: string ):Observable <bBalanceData[]> {
    const params = {
      'accountId': accountId, 
      'transactionAmount' : parseFloat(transactionAmount.toString().replace(/,/g, '')), 
      'transactionDate': transactionDate,
      'xactTypeCode': xactTypeCode,
      'id': id,
      'FirstOpenedAccountingDate': FirstOpenedAccountingDate, 
      'Action': Action
    }
    return this.http.get <bBalanceData []>('/api/DEA/accountingOverdraftAccountCheck/', { params: params })
  }
  getExpectedBalanceLedgerOverdraftCheck (accountId: number, transactionAmount:number, transactionDate: string, xactTypeCode: number, id: number, FirstOpenedAccountingDate: string, Action: string ):Observable <bLedgerBalanceData[]> {
    const params = {
      'accountId': accountId, 
      'transactionAmount' : parseFloat(transactionAmount.toString().replace(/,/g, '')), 
      'transactionDate': transactionDate,
      'xactTypeCode': xactTypeCode,
      'id': id,
      'FirstOpenedAccountingDate': FirstOpenedAccountingDate, 
      'Action': Action
    }
    return this.http.get <bLedgerBalanceData []>('/api/DEA/accountingOverdraftLedgerAccountCheck/', { params: params })
  }
  /*----------------------Balance Sheets----------------------------------------------------*/
  GetALLClosedBalances (searchParameters:any, id: number, lastClosedDate:string, Sender: string, Action: string):Observable <bBalanceFullData[]> {
    let params = {'id' :id, 'lastClosedDate': lastClosedDate,'Sender':Sender, 'Action': Action};
    (searchParameters !== null) ?  params = {...params,...searchParameters}: null
    return this.http.get <bBalanceFullData []>('/api/DEA/fGetAccountingData/', { params: params })
  }
  sendReloadBalanceSheet ( id:any) {this.subjectReloadBalanceSheet.next(id)}
  getReloadBalanceSheet(): Observable<any> {return this.subjectReloadBalanceSheet.asObservable()}

  accountingBalanceCloseInsert (data:any) {return this.http.post <any[]> ('/api/DEA/accountingBalanceCloseInsert/',{'data': data})}
  accountingBalanceDayOpen (data:any) {return this.http.post <any[]> ('/api/DEA/accountingBalanceDayOpen/',{'data': data})}
  GetDeepBalanceCheck (dateBalanceToCheck:string, firstDayOfCalculation: string, Action: string):Observable <bBalanceFullData[]> {
    let params = {'dateBalanceToCheck': dateBalanceToCheck,'firstDayOfCalculation':firstDayOfCalculation, 'Action': Action};
    return this.http.get <bBalanceFullData []>('/api/DEA/fGetAccountingData/', { params: params })
  }
}