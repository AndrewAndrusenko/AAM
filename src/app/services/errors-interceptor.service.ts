import {HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse} from '@angular/common/http';
import { Injectable } from '@angular/core';
import {Observable, Subject, of, throwError} from 'rxjs';
import {catchError, exhaustMap, map} from "rxjs/operators";
import { HadlingCommonDialogsService } from './hadling-common-dialogs.service';
import { Router } from '@angular/router';

@Injectable()
export class ErrorCatchingInterceptor implements HttpInterceptor {
  private errorPipe = new Subject <boolean>
  constructor(
  private CommonDialogsService:HadlingCommonDialogsService,
  private router : Router

  ) { 
    this.errorPipe.pipe (
      exhaustMap(d=>this.CommonDialogsService.confirmDialog('Your session is not AUTHENTICATED.\nYou have to LOG IN again.\nPlease confirm redirect to login page','Go to login')),
      ).subscribe(c=>c.isConfirmed? this.router.navigate(['login']):null)
   }
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
  return next.handle(request)
    .pipe(
        map(res => {
            return res
        }),
        catchError((error: HttpErrorResponse) => {
            let errorMsg = '';
            if (error.error instanceof ErrorEvent) {
                console.log('This is client side error');
                errorMsg = `Error: ${error.error.message}`;
            } else {
                console.log('This is server side error');
                switch (error.status) {
                  case 401:
                    this.errorPipe.next(true)
                  break;
                
                  default:
                    break;
                }
                // console.log('err',error.error.detail? error.error.detail : error);
                error.error.detail? this.CommonDialogsService.snackResultHandler({name:'error',detail: error.error.detail.split('\n')[0]}):null
                errorMsg = `Error Code: ${error.status},  Message: ${error.message}`;
            }
            return throwError(() => error)
        })
    )
  }
}