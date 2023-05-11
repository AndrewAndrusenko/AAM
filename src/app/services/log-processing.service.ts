import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { bAccountsEntriesList, cFormValidationLog } from '../models/intefaces';

@Injectable({
  providedIn: 'root'
})
export class LogProcessingService {
  private subjectErrorLogObject= new Subject<any>();
  private subjectCreatedtLogObject = new Subject<any>();

  constructor() { }

  sendLogObject ( LogObject:cFormValidationLog[]) { //the component that wants to update something, calls this fn
    this.subjectErrorLogObject.next(LogObject); //next() will feed the value in Subject
  }
  getLogObject(): Observable<cFormValidationLog[]> { //the receiver component calls this function 
    return this.subjectErrorLogObject.asObservable(); //it returns as an observable to which the receiver funtion will subscribe
  }
  sendCreatedLogObject ( LogObject:bAccountsEntriesList) { //the component that wants to update something, calls this fn
    this.subjectCreatedtLogObject.next(LogObject); //next() will feed the value in Subject
  }
  geCreatedtLogObject(): Observable<bAccountsEntriesList> { //the receiver component calls this function 
    return this.subjectCreatedtLogObject.asObservable(); //it returns as an observable to which the receiver funtion will subscribe
  }
}

