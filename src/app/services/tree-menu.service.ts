import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable ({
  providedIn:'root'
})
export class TreeMenuSevice {
  constructor (private http:HttpClient) {    
  }
  getTreeData ():Observable < string[]>{
   return this.http.get <string[]>('http://localhost:3000/AAM/Accounts')
  }
}