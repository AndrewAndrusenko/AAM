
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
interface favoriteObject {
  id: number,
  nodename: string,
  nodeparent: number,
  userid: number,
  idelement: number
}
@Injectable ({
  providedIn:'root'
})
export class TreeMenuSevice {
  constructor (private http:HttpClient) {    
  }
  private subjectName = new Subject<{text: string, name:string, id:number, action:string}>(); 
  private subjectTabName = new Subject <string>();
  
  getTreeData ( userId:number, paramList: string[] ):Observable < string[]>{
    const params = {'userId': userId, 'paramList': paramList}
    return this.http.get <string[]>('/api/AAM/treeMenu/',{ params: params } ) 
  }
  public addItemToFavorites (nodename:string, nodeparent:string, userId:number, idelement:string):Observable<favoriteObject[]> { 
    return this.http.post <favoriteObject[]> ('/api/Favorites/newItem/',{'nodename': nodename, 'nodeparent' : nodeparent, 'userId' : userId, 'idelement':idelement})
  }
  public removeItemFromFavorites (nodename:string, userId:number, idelement:string):Observable<favoriteObject[]> {
    return this.http.post <favoriteObject[]>('/api/Favorites/deleteItem/',{'nodename': nodename, 'userId' : userId, 'idelement':idelement})
  }
  sendUpdate(nodeRoot: string, item: string, id:number,action?:string) { 
    this.subjectName.next({ text: nodeRoot, name:item, id:+id, action:action }); 
  }
  getUpdate(): Observable<{text: string, name:string, id:number, action:string}> { 
    return this.subjectName.asObservable(); 
  }
  sendActiveTab(tabName: string) { 
    this.subjectTabName.next(tabName); 
  }
  getActiveTab(): Observable<string> { 
    return this.subjectTabName.asObservable();  
  }
}