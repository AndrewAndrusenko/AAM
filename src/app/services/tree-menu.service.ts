import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable ({
  providedIn:'root'
})
export class TreeMenuSevice {
  constructor (private http:HttpClient) {    
  }
  getTreeData ():Observable <Map <string, string[]>>{
   return this.http.get <Map <string, string[]>>('http://localhost:3002/AAM/Accounts')
  }
}