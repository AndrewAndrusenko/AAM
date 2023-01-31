import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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

  public setUserInfo(user){
    console.log ('user',user)
    localStorage.setItem('userInfo',JSON.stringify(user));
  }

  public validate(login, password) {
    return this.http.post ('/api/auth/',{'username' : login, 'password' : password}).toPromise()
  }
  public createNewUser(userrole, login, password) { 
    return this.http.post ('/api/auth/newUser/',{'accessrole': userrole, 'username' : login, 'password' : password}).toPromise()
  }

  public LogOut() { 
    localStorage.removeItem('userInfo')
    this.http.post ('/api/logout/',{}).toPromise()
    
  }
  
  public getUsersRoles(): Observable < userRoles[]>{
    return this.http.get < userRoles[]> ('/api/auth/userRoles/')
  }
}
