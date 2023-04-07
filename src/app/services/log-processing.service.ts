import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { cFormValidationLog } from '../models/accounts-table-model';

@Injectable({
  providedIn: 'root'
})
export class LogProcessingService {
  private subjectName = new Subject<any>();

  constructor() { }

  sendLogObject ( LogObject:cFormValidationLog[]) { //the component that wants to update something, calls this fn
    this.subjectName.next(LogObject); //next() will feed the value in Subject
  }
  getLogObject(): Observable<cFormValidationLog[]> { //the receiver component calls this function 
    return this.subjectName.asObservable(); //it returns as an observable to which the receiver funtion will subscribe
  }
}
