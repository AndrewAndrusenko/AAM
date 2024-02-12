import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { bcTransactionType_Ext } from "../models/accountng-intefaces.model";
@Injectable ({
  providedIn:'root'
})

export class AccountingSchemesService {
  public TransactionTypes: Map <string,string>
  private subjectTransactionTypes = new Subject <null>
  constructor (private http:HttpClient ) {
    this.TransactionTypes = new Map ([
      ['0','Ledger - Ledger'],
      ['1','Account - Ledger - Debit'],
      ['2','Account - Ledger - Credit']
    ])
  }
  getTransactionTypes ():Observable<bcTransactionType_Ext[]> {
    return this.http.get <bcTransactionType_Ext[]> ('api/DEA/getAccountingSchemes/',{params:{action:'getTransactionTypes'}})
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
}