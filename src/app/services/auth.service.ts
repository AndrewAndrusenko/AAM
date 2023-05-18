import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { accessRestriction } from '../models/intefaces';
interface userRoles {
  value: string;
}
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private http : HttpClient) { }
  public isAuthenticated() : Boolean {
    let userData= localStorage.getItem('userInfo')
    if (userData && JSON.parse(userData)) {
    return true}
    return false;
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
    console.log ('user',user)
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
  getUsersRoles(): Observable < userRoles[]>{
    return this.http.get < userRoles[]> ('/api/auth/userRoles/')
  }
  getaccessRestriction ( accessRole: string, elementid: string ):Observable < string[]>{
    const params = {'accessRole': accessRole, 'elementid': elementid}
    return this.http.get <string[]>('/api/accessRestriction/',{ params: params } ) 
  }
}
