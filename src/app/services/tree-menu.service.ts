import { HttpClient, HttpParams  } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, Subject } from 'rxjs';
@Injectable ({
  providedIn:'root'
})
export class TreeMenuSevice {
  constructor (private http:HttpClient) {    
  }
  
  getTreeData ( userId:number, paramList: string[] ):Observable < string[]>{
    const params = {'userId': userId, 'paramList': paramList}
    return this.http.get <string[]>('/api/AAM/treeMenu/',{ params: params } ) 
  }
  public addItemToFavorites (nodename:string, nodeparent:string, userId:number, idelement:string) { 
    return this.http.post ('/api/Favorites/newItem/',{'nodename': nodename, 'nodeparent' : nodeparent, 'userId' : userId, 'idelement':idelement}).toPromise()
  }
  public removeItemFromFavorites (nodename:string, userId:number, idelement:string) {
    console.log('idelement',idelement);
    return this.http.post ('/api/Favorites/deleteItem/',{'nodename': nodename, 'userId' : userId, 'idelement':idelement}).toPromise()
  }
  private subjectName = new Subject<any>(); 

  sendUpdate(nodeRoot: string, item: string, id:number) { //the component that wants to update something, calls this fn
    this.subjectName.next({ text: nodeRoot, name:item, id:+id }); //next() will feed the value in Subject
  }

  getUpdate(): Observable<any> { //the receiver component calls this function 
    return this.subjectName.asObservable(); //it returns as an observable to which the receiver funtion will subscribe
  }
}