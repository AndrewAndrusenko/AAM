import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class RouteGuardService implements CanActivate {
  user:string;
  constructor() { }

  public canActivate(route: ActivatedRouteSnapshot){
    let AppUsers =["admin", "officer", "manager", "pmanager", "pmanager1", "mofficer", "amanager"]
    this.user = sessionStorage.getItem('user');
    console.log(this.user)
    if (AppUsers.includes(this.user)) {return true;}     
    return false;
  }
}