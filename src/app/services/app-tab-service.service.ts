import { HttpClient, HttpParams  } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { map, Observable, Subject } from 'rxjs';
import { AccountsTableModel } from "../models/accounts-table-model";
import { InstrumentData, ClientData } from "../models/accounts-table-model";

@Injectable({
  providedIn: 'root'
})
export class AppTabServiceService {
  constructor(private http:HttpClient) { }

  getAccountsData (clientId: number, strategyId: number, accountType:string, actionOnAccountTable: string):Observable <AccountsTableModel[]> {
    const params = {'clientId': clientId, 'strategyId' :strategyId, 'accountType': accountType,'actionOnAccountTable':actionOnAccountTable }
    return this.http.get <AccountsTableModel []>('/api/AAM/portfolioTable/', { params: params })
  }

  getInstrumentData (secid: string): Observable <InstrumentData[]>  {
    const params = {'secid': secid}
    return this.http.get <InstrumentData[]> ('/api/AAM/InstrumentData/',{ params: params } )
  }
  getSecidLists (secid: string): Observable <string[]>  {
    console.log('ac', secid);
    // const params = {'secid': ''}
    return this.http
    .get <InstrumentData[]> ('/api/AAM/InstrumentData/')
    .pipe(map(instrumentList => instrumentList.map(({secid}) => secid)));
  }
  getClientData (client: number, clientname: string, action: string) : Observable <ClientData[]>  {
    const params = {'client': client, 'clientname' :clientname, 'action':action }
    return this.http.get <ClientData[]> ('/api/AAM/ClientData/', { params: params } )
  }

  updateClient (data:any) { 
    return this.http.post ('/api/AAM/ClientDataEdit/',{'data': data}).toPromise()
  }
  deleteClient (id:string) {
    return this.http.post ('/api/AAM/ClientDataDelete/',{'idclient': id}).toPromise()
  }
  createClient (data:any) { 
    return this.http.post ('/api/AAM/ClientDataCreate/',{'data': data}).toPromise()
  }

}
