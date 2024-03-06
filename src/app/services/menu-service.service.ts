import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppMenuServiceService {

  constructor() { }
  private subjectName = new Subject <{ text: boolean }> (); 

  sendToggleTree (treeState: boolean) { 
    this.subjectName.next({ text: treeState }); 
  }
  getToggleTree(): Observable<{ text: boolean }> { 
    return this.subjectName.asObservable(); 
  }
}
