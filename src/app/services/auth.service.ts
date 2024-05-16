import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, switchMap, tap } from 'rxjs';
import { accessRestriction, objectStatus } from '../models/interfaces.model';
import { Router } from '@angular/router';

interface siginResult {
  message: string,
  username: userData,
  sessionID:string
}
interface userData {
    id: number,
    accessrole: string,
    login: string,
    hashed_password: string,
}
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    private http : HttpClient,
    private router : Router
    ) { }
  public dbAccessRoles =[
    'aam_middile_officer',
    'aam_back_officer',
    'aam_portfolio_manager',
    'aam_trader',
    'aam_accountant',
    'aam_salesRM',
    'aam_clientManager'
  ]
  accessRestrictions: accessRestriction[] = [];
  objectStatuses: objectStatus[] = [];
  userId:number;
  public isAuthenticated() : boolean {
    if (Object.hasOwn(localStorage,'userInfo')) {
    let userData =  Object.hasOwn(localStorage,'userInfo')? localStorage.getItem('userInfo'):'{user:null}'
    return userData && JSON.parse(userData) ?  true : false;
    } else {
      return false
    } 
  }
  getAllAccessRestrictions():Observable<boolean> {
      if (Object.hasOwn(localStorage,'userInfo')) {
        let userData =  JSON.parse(localStorage.getItem('userInfo'));
        const params = {accessRole: userData.user.accessrole,action:'getAccessRestriction'}
        this.userId=userData.user.id
        return this.http.get <accessRestriction[]>('/api/accessRestriction/',{ params: params }).pipe(
          tap(data=>this.accessRestrictions = data),
          switchMap(data=>of(data.length>0))
      )} else {
        return of(false)
      }
  }
  getObjectStatuses () {
      let userData = JSON.parse(localStorage.getItem('userInfo'))
      const params = {accessRole: userData.user.accessrole,action:'getObjectStatuses'}
      this.http.get <objectStatus[]>('/api/accessRestriction/',{ params: params }).subscribe((data) => {
        this.objectStatuses = data;
      })
  }
  verifyAccessRestrictions (elementid:string ):Observable <accessRestriction>  {
    let userData = JSON.parse(localStorage.getItem('userInfo'))
    const params = {'accessRole': userData.user.accessrole, 'elementid': elementid}
    return this.http.get <accessRestriction>('/api/accessRestriction/',{ params: params }).pipe(
      tap(data => Object.hasOwn(data,'accessrole')? data : {accessrole:userData.user.accessrole, 
        elementid:null, 
        tsmodule:null, 
        htmltemplate:null, 
        elementtype:null, 
        elementvalue:'none'})) 
  } 
  setUserInfo(user:{'user' : userData},sessionID:string){
    localStorage.setItem('userInfo',JSON.stringify(user));
    sessionID? localStorage.setItem('sessionID',sessionID):null;
  }
  validate(login:string, password:string):Observable<siginResult> {
    return this.http.post <siginResult> ('/api/auth/',{'username' : login, 'password' : password})
  }
  createNewUser(userrole:string, login:string, password: string):Observable<userData> { 
    return this.http.post<userData> ('/api/auth/newUser/',{'accessrole': userrole, 'username' : login, 'password' : password})
  }
  LogOut() { 
    localStorage.clear()
    this.http.post ('/api/logout/',{}).subscribe(d=>{
      console.log('sub logout',);
      this.router.navigate(['login']);   
      })
  }
  getUsersRoles(): Observable <string[]>{
    return this.http.get < string[]> ('/api/auth/userRoles/')
  }
  getloginsArray(): Observable <string[]>{
    return this.http.get <string[]> ('/api/auth/loginsArray/')
  }
  nodeTerminalClear(): Observable <string> {
    return this.http.get <string> ('/api/nodecls/')
  }
}
