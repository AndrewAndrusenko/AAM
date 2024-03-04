import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, Subject, exhaustMap } from "rxjs";
import { bcAccountType_Ext, bcTransactionType_Ext } from "../models/accountng-intefaces.model";
import { indexDBService } from "./indexDB.service";
import { bcSchemeAccountTransaction, bcSchemeLedgerTransaction, bcSchemesParameters, bcSchemesProcesses } from "../models/acc-schemes-interfaces";
@Injectable ({
  providedIn:'root'
})
export class AccountingSchemesService {
  public TransactionTypes: Map <string,string>
  public subjectTransactionTypePipe = new Subject <null>
  private subjectTransactionTypeReady = new Subject <{key:string, data:bcTransactionType_Ext[]}>
  private subjectTransactionTypes = new Subject <null>
  private subjectSchemeLedgerTransaction = new Subject <null>
  private subjectSchemeAccountTransaction = new Subject <null>
  constructor (
    private http:HttpClient,
    private indexDBService: indexDBService
  ) 
  { this.subjectTransactionTypePipe.pipe (
      exhaustMap(()=>this.indexDBService.getIndexDBStaticTables('bcTransactionType_Ext')),
    ).subscribe(data => {
      this.sendTransactionTypesReady({key:data.code, data:(data.data as bcTransactionType_Ext[])});
    });
    this.TransactionTypes = new Map ([
      ['0','Ledger - Ledger'],
      ['1','Ledger - Account (Credit)'],
      ['2','Ledger - Account (Debit)']
    ])
  }
  sendTransactionTypesReady (typesData:{key:string, data:bcTransactionType_Ext[]}) {
    this.subjectTransactionTypeReady.next(typesData)
  }
  receiveTransactionTypesReady ():Observable<{key:string, data:bcTransactionType_Ext[]}> {
    return this.subjectTransactionTypeReady.asObservable();
  }
  getTransactionTypes ():Observable<bcTransactionType_Ext[]> {
    return this.http.get <bcTransactionType_Ext[]> ('api/DEA/getAccountingSchemes/',{params:{action:'getTransactionTypes'}})
  } 
  rewriteTransactionTypes (data:bcTransactionType_Ext[]) {
    this.indexDBService.rewrteIndexDBStaticTable('bcTransactionType_Ext',data).subscribe(()=>{
      this.sendTransactionTypesReady({key:'bcTransactionType_Ext',data:data})
    })
  } 
  getSchemeLedgerTransaction ():Observable<bcSchemeLedgerTransaction[]> {
    return this.http.get <bcSchemeLedgerTransaction[]> ('api/DEA/getAccountingSchemes/',{params:{action:'getSchemeLedgerTransaction'}})
  } 
  getSchemeAccountTransaction ():Observable<bcSchemeAccountTransaction[]> {
    return this.http.get <bcSchemeAccountTransaction[]> ('api/DEA/getAccountingSchemes/',{params:{action:'getSchemeAccountTransaction'}})
  } 
  updateSchemeLedgerTransaction (data:bcSchemeAccountTransaction|bcSchemeLedgerTransaction,action:string,table:string):Observable<bcSchemeAccountTransaction|bcSchemeLedgerTransaction[]> {
    return this.http.post <bcSchemeAccountTransaction|bcSchemeLedgerTransaction[]> ('api/DEA/updateSchemeTransaction/',{data:data,action:action,table:table})
  }
  updateTransactionTypes (data:bcTransactionType_Ext,action:string):Observable<bcTransactionType_Ext[]> {
    return this.http.post <bcTransactionType_Ext[]> ('api/DEA/updateTransactionTypes/',{data:data,action:action})
  }
  receiveTransactionTypesReload () {
    return this.subjectTransactionTypes.asObservable()
  }
  sendTransactionTypesReload () {
    this.subjectTransactionTypes.next(null)
  }
  sendSchemeLedgerTransactionReload () {
    this.subjectSchemeLedgerTransaction.next(null)
  }
  receiveSchemeLedgerTransactionReload () {
    return this.subjectSchemeLedgerTransaction.asObservable()
  }
  receiveSchemeAccountTransactionReload () {
    return this.subjectSchemeAccountTransaction.asObservable()
  }
  sendSchemeAccountTransactionReload () {
    this.subjectSchemeAccountTransaction.next(null)
  }
  getSchemesProcesses ():Observable<bcSchemesProcesses[]> {
    return this.http.get <bcSchemesProcesses[]> ('api/DEA/getAccountingSchemes/',{params:{action:'getSchemesProcesses'}})
  }
  getSchemesParameters ():Observable<bcSchemesParameters[]> {
    return this.http.get <bcSchemesParameters[]> ('api/DEA/getAccountingSchemes/', {params:{action:'getSchemesParameters'}})
  }
}