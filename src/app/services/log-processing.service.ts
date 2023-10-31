import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { bAccountsEntriesList, cFormValidationLog } from '../models/intefaces.model';

@Injectable({
  providedIn: 'root'
})
export class LogProcessingService {
  private subjectErrorLogObject= new Subject<any>();
  private subjectCreatedtLogObject = new Subject<any>();

  constructor() { }

  sendLogObject ( LogObject:cFormValidationLog[]) { 
    this.subjectErrorLogObject.next(LogObject); //next() will feed the value in Subject
  }
  getLogObject(): Observable<cFormValidationLog[]> { 
    return this.subjectErrorLogObject.asObservable(); 
  }
  sendCreatedLogObject ( LogObject:bAccountsEntriesList) { 
    this.subjectCreatedtLogObject.next(LogObject); //next() will feed the value in Subject
  }
  geCreatedtLogObject(): Observable<bAccountsEntriesList> { 
    return this.subjectCreatedtLogObject.asObservable(); 
  }
}

