import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppMenuServiceService {

  constructor() { }
  private subjectName = new Subject <any> (); 

  sendToggleTree (treeState: boolean) { 
    this.subjectName.next({ text: treeState }); //next() will feed the value in Subject
  }
  getToggleTree(): Observable<any> { 
    return this.subjectName.asObservable(); 
  }
}
