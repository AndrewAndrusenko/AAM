import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable, of, switchMap, tap } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class AuthGuardService implements CanActivate {
  constructor(private authService : AuthService, private route : Router ) { }
  canActivate(): Observable<boolean> {
    return this.authService.getAllAccessRestrictions().pipe(
      tap(()=>this.authService.isAuthenticated()? null: this.route.navigate(['login'])),
      switchMap(()=>of(this.authService.isAuthenticated()))
    )
  }
}
