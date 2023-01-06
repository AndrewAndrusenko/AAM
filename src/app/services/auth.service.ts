import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http : HttpClient) { }

  public isAuthenticated() : Boolean {
    let userData= localStorage.getItem('userInfo')
    if (userData && JSON.parse(userData)) { return true}
    return false;
  }

  public setUserInfo(user){
    localStorage.setItem('userInfo',JSON.stringify(user));
    console.log ('localStorage', user, JSON.stringify(user))
  }

  public validate(login, password) {
    return this.http.post ('http://localhost:3000/auth/',{'username' : login, 'password' : password}).toPromise()
  }
  public createNewUser(userrole, login, password) {
 
    return this.http.post ('http://localhost:3000/auth/newUser/',{'accessrole': userrole, 'username' : login, 'password' : password}).toPromise()
  }
}
