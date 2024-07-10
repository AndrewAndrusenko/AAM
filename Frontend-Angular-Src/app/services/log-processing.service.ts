import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { bAccountsEntriesList } from '../models/accountng-intefaces.model';
import { cFormValidationLog } from '../models/interfaces.model';

@Injectable({
  providedIn: 'root'
})
export class LogProcessingService {
  private subjectErrorLogObject= new Subject<cFormValidationLog[]>();
  private subjectCreatedtLogObject = new Subject<bAccountsEntriesList>();

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

