import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject} from 'rxjs';
import { bAccounts, bAccountsEntriesList, bBalanceData, bcAccountType_Ext, bcEnityType, bcTransactionType_Ext, bLedger, bLedgerAccounts, bLedgerBalanceData, SWIFTSGlobalListmodel, SWIFTStatement950model } from '../models/accounts-table-model';

@Injectable({
  providedIn: 'root'
})
export class AppAccountingService {
  constructor(private http:HttpClient) { }
  private subjectName = new Subject<any>(); 
/* -----------------------Accountting ----------------------------------------------------- */

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
  GetEntityTypeList (dataRange: string, id: number, MTType:string, Sender: string, Action: string):Observable <bcEnityType[]> {
    const params = {'dataRange': dataRange, 'id' :id, 'MTType': MTType,'Sender':Sender, 'Action': Action}
    return this.http.get <bcEnityType []>('/api/DEA/fGetAccountingData/', { params: params })
  }
  GetAccountTypeList (dataRange: string, id: number, MTType:string, Sender: string, Action: string):Observable <bcAccountType_Ext[]> {
    const params = {'dataRange': dataRange, 'id' :id, 'MTType': MTType,'Sender':Sender, 'Action': Action}
    return this.http.get <bcAccountType_Ext []>('/api/DEA/fGetAccountingData/', { params: params })
  }
  GetAccountData (currencyCode: number, id: number, clientId:number, accountNo: string, Action: string):Observable <bAccounts[]> {
    const params = {'currencyCode': currencyCode, 'id' :id, 'clientId': clientId,'accountNo':accountNo, 'Action': Action}
    return this.http.get <bAccounts []>('/api/DEA/fGetAccountingData/', { params: params })
  }
  GetLedgerData (currencyCode: number, id: number, clientId:number, accountNo: string, Action: string):Observable <bLedger[]> {
    const params = {'currencyCode': currencyCode, 'id' :id, 'clientId': clientId,'accountNo':accountNo, 'Action': Action}
    return this.http.get <bLedger []>('/api/DEA/fGetAccountingData/', { params: params })
  }
  /*----------------------Create entry by scheme---------------------------------------------------------*/

  GetEntryScheme (bcEntryParameters:any) :Observable <bcTransactionType_Ext[]> { 
    return this.http.get <bcTransactionType_Ext []>('/api/DEA/GetEntryScheme/', { params: bcEntryParameters })  
  } 
  sendEntryDraft (data: any) { this.subjectName.next(data);}
  getEntryDraft (): Observable<any> {return this.subjectName.asObservable(); }

  CreateEntryAccountingInsertRow (data:any) { 
    return this.http.post ('/api/DEA/fCreateEntryAccountingInsertRow/',{'data': data}).toPromise()
  } 
  /*End------------------Create entry by scheme---------------------------------------------------------*/

  GetAccountsEntriesListAccounting (dataRange: string, id: number, MTType:string, Sender: string, Action: string):Observable <bAccountsEntriesList[]> {
    const params = {'dataRange': dataRange, 'id' :id, 'MTType': MTType,'Sender':Sender, 'Action': Action}
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
  /*----------------------AccountsUI---------------------------------------------------------*/

  createAccountAccounting (data:any) { 
    return this.http.post ('/api/DEA/createAccountAccounting/',{'data': data}).toPromise()
  }
  deleteAccountAccounting (id:string) { 
    return this.http.post ('/api/DEA/deleteAccountAccounting/',{'id': id}).toPromise()
  } 
  updateAccountAccounting (data:any) { 
    return this.http.post ('/api/DEA/updateAccountAccounting/',{'data': data}).toPromise()
  }
  sendReloadAccontList ( id:any) { //the component that wants to update something, calls this fn
    this.subjectName.next(id); //next() will feed the value in Subject
  }
  getReloadAccontList(): Observable<any> { //the receiver component calls this function 
    return this.subjectName.asObservable(); //it returns as an observable to which the receiver funtion will subscribe
  }
/*----------------------LedgerAccountsUI----------------------------------------------------*/
  createLedgerAccountAccounting (data:any) { 
    return this.http.post ('/api/DEA/createLedgerAccountAccounting/',{'data': data}).toPromise()
  }
  deleteLedgerAccountAccounting (id:string) { 
    return this.http.post ('/api/DEA/deleteLedgerAccountAccounting/',{'id': id}).toPromise()
  } 
  updateLedgerAccountAccounting (data:any) { 
    return this.http.post ('/api/DEA/updateLedgerAccountAccounting/',{'data': data}).toPromise()
  }
  sendReloadLedgerAccontList ( id:any) { //the component that wants to update something, calls this fn
    this.subjectName.next(id); //next() will feed the value in Subject
  }
  getReloadLedgerAccontList(): Observable<any> { //the receiver component calls this function 
    return this.subjectName.asObservable(); //it returns as an observable to which the receiver funtion will subscribe
  }
/*----------------------EntryUI----------------------------------------------------*/
  fcreateEntryAccounting (data:any) { 
    return this.http.post ('/api/DEA/createEntryAccounting/',{'data': data}).toPromise()
  }
  deleteEntryrAccountAccounting (id:string) { 
    return this.http.post ('/api/DEA/deleteEntryrAccountAccounting/',{'id': id}).toPromise()
  } 
  updateEntryAccountAccounting (data:any) { 
    console.log('ser', data);
    return this.http.post ('/api/DEA/updateEntryAccountAccounting/',{'data': data}).toPromise()
  }
  createLLEntryAccounting (data:any) { 
    return this.http.post ('/api/DEA/createLLEntryAccounting/',{'data': data}).toPromise()
  }
  deleteLLEntryrAccountAccounting (id:string) { 
    return this.http.post ('/api/DEA/deleteLLEntryrAccountAccounting/',{'id': id}).toPromise()
  } 
  updateLLEntryAccountAccounting (data:any) { 
    console.log('ser', data);
    return this.http.post ('/api/DEA/updateLLEntryAccountAccounting/',{'data': data}).toPromise()
  }
  sendReloadEntryList ( id:any) { //the component that wants to update something, calls this fn
    this.subjectName.next(id); //next() will feed the value in Subject
  }
  getReloadEntryList(): Observable<any> { //the receiver component calls this function 
    return this.subjectName.asObservable(); //it returns as an observable to which the receiver funtion will subscribe
  }

/*----------------------OverdraftValidators----------------------------------------------------*/
getExpectedBalanceOverdraftCheck (accountId: number, transactionAmount:number, transactionDate: string, xactTypeCode: number, id: number, Action: string ):Observable <bBalanceData[]> {
  console.log('transactionAmount',transactionAmount);
  const params = {
    'accountId': accountId, 
    'transactionAmount' : parseFloat(transactionAmount.toString().replace(/,/g, '')), 
    'transactionDate': transactionDate,
    'xactTypeCode': xactTypeCode,
    'id': id,
    'Action': Action
  }
  return this.http.get <bBalanceData []>('/api/DEA/accountingOverdraftAccountCheck/', { params: params })
}

getExpectedBalanceLedgerOverdraftCheck (accountId: number, transactionAmount:number, transactionDate: string, xactTypeCode: number, id: number, Action: string ):Observable <bLedgerBalanceData[]> {
  const params = {
    'accountId': accountId, 
    'transactionAmount' : parseFloat(transactionAmount.toString().replace(/,/g, '')), 
    'transactionDate': transactionDate,
    'xactTypeCode': xactTypeCode,
    'id': id,
    'Action': Action
  }
  return this.http.get <bLedgerBalanceData []>('/api/DEA/accountingOverdraftLedgerAccountCheck/', { params: params })
}



sendUpdateExpectedBalance ( id:any) { //the component that wants to update something, calls this fn
  this.subjectName.next(id); //next() will feed the value in Subject
}
getUpdateExpectedBalance(): Observable<any> { //the receiver component calls this function 
  return this.subjectName.asObservable(); //it returns as an observable to which the receiver funtion will subscribe
}

}
