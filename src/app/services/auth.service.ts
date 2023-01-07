import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http : HttpClient) { }

  public isAuthenticated() : Boolean {
    console.log ('isAuthenticated')
    

    let userData= localStorage.getItem('userInfo')
    console.log ('userData', userData)
    if (userData && JSON.parse(userData)) {
    console.log ('isAuthenticated', 'true')
    return true}
    console.log ('isAuthenticated', 'false')

    return false;
  }

  public setUserInfo(user){
    console.log ('setUserInfo')
    localStorage.setItem('userInfo',JSON.stringify(user));
    //console.log ('localStorage', user, JSON.stringify(user))
  }

  public validate(login, password) {
    return this.http.post ('http://localhost:3000/auth/',{'username' : login, 'password' : password}).toPromise()
  }
  public createNewUser(userrole, login, password) { 
    return this.http.post ('http://localhost:3000/auth/newUser/',{'accessrole': userrole, 'username' : login, 'password' : password}).toPromise()
  }


  public LogOut() { 
    localStorage.removeItem('userInfo')
    console.log('AngLogOut')
    this.http.post ('http://localhost:3000/logout/',{}).toPromise()
    
  }
  
}
