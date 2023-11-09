import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { accessRestriction, objectStatus } from '../models/intefaces.model';
interface userRoles {
  value: string;
}
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private http : HttpClient) { }
  accessRestrictions: accessRestriction[] = [];
  objectStatuses: objectStatus[] = [];

  public isAuthenticated() : Boolean {
    let userData= localStorage.getItem('userInfo')
    // return userData && JSON.parse(userData) && JSON.parse(userData).user.accessrole !=='testRole'?  true : false;
    return userData && JSON.parse(userData) ?  true : false;
  }
  async getAllAccessRestrictions () {
    return new Promise <boolean> ((resolve,reject) => { 
      let userData = JSON.parse(localStorage.getItem('userInfo'))
      const params = {accessRole: userData.user.accessrole,action:'getAccessRestriction'}
      this.http.get <accessRestriction[]>('/api/accessRestriction/',{ params: params }).subscribe((data) => {
        this.accessRestrictions = data;
        data.length? resolve(true) : reject(false)
      })
    })
  }
  async getObjectStatuses () {
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
  setUserInfo(user){
    localStorage.setItem('userInfo',JSON.stringify(user));
  }
  validate(login, password) {
    return this.http.post ('/api/auth/',{'username' : login, 'password' : password}).toPromise()
  }
  createNewUser(userrole, login, password) { 
    return this.http.post ('/api/auth/newUser/',{'accessrole': userrole, 'username' : login, 'password' : password}).toPromise()
  }
  LogOut() { 
    localStorage.removeItem('userInfo')
    this.http.post ('/api/logout/',{}).toPromise()
  }
  getUsersRoles(): Observable <userRoles[]>{
    return this.http.get < userRoles[]> ('/api/auth/userRoles/')
  }
  getloginsArray(): Observable <string[]>{
    return this.http.get <string[]> ('/api/auth/loginsArray/')
  }
  nodeTerminalClear(): Observable <string> {
    return this.http.get <string> ('/api/nodecls/')
  }
}
