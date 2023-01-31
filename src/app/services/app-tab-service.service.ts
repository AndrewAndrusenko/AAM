import { HttpClient, HttpParams  } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, Subject } from 'rxjs';
import { AccountsTableModel } from "../models/accounts-table-model";
import { InstrumentData } from "../models/accounts-table-model";

@Injectable({
  providedIn: 'root'
})
export class AppTabServiceService {
  constructor(private http:HttpClient) { }

getAccountsData ():Observable <AccountsTableModel[]> {
  return this.http.get <AccountsTableModel []>('/api/AAM/portfolioTable/')
}

getInstrumentData (secid:string) : Observable <InstrumentData[]>  {
  const params = {'secid': secid}
  return this.http.get <InstrumentData[]> ('/api/AAM/InstrumentData/',{ params: params } )
}

getClientData (client:number) : Observable <InstrumentData[]>  {
  const params = {'client': client}
  return this.http.get <InstrumentData[]> ('/api/AAM/ClientData/',{ params: params } )
}
updateClient (data:any) { 
  return this.http.post ('/api/AAM/ClientDataEdit/',{'data': data}).toPromise()
}
}
