import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, Subject } from 'rxjs';
@Injectable ({
  providedIn:'root'
})
export class TreeMenuSevice {
  constructor (private http:HttpClient) {    
  }
  getTreeData ():Observable < string[]>{
    return this.http.get <string[]>('http://localhost:3000/AAM/Accounts')
  }
  public addItemToFavorites (nodename:string, nodeparent:string, userId:number) { 
    return this.http.post ('http://localhost:3000/Favorites/newItem/',{'nodename': nodename, 'nodeparent' : nodeparent, 'userId' : userId}).toPromise()
  }
  private subjectName = new Subject<any>(); 

  sendUpdate(message: string) { //the component that wants to update something, calls this fn
    this.subjectName.next({ text: message }); //next() will feed the value in Subject
  }

  getUpdate(): Observable<any> { //the receiver component calls this function 
    return this.subjectName.asObservable(); //it returns as an observable to which the receiver funtion will subscribe
  }
}