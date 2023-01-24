import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppMenuServiceService {

  constructor() { }
  private subjectName = new Subject <any> (); 

  sendToggleTree (treeState: boolean) { //the component that wants to update something, calls this fn
    this.subjectName.next({ text: treeState }); //next() will feed the value in Subject
  }
  getToggleTree(): Observable<any> { //the receiver component calls this function 
    return this.subjectName.asObservable(); //it returns as an observable to which the receiver funtion will subscribe
  }
}
