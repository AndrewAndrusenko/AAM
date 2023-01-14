import { HttpClient, HttpParams  } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, Subject } from 'rxjs';
import { AccountsTableModel } from "../models/accounts-table-model";

@Injectable({
  providedIn: 'root'
})
export class AppTabServiceService {

  constructor(private http:HttpClient) { }
getAccountsData ():Observable <AccountsTableModel[]> {
  return this.http.get <AccountsTableModel[]>('http://localhost:3000/AAM/portfolioTable/')
}
}
