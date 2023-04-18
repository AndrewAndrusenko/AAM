import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AtuoCompSecidService {
  public fullInstrumentsLists :string [] =[];
  private subjectSecIDList = new Subject<string[]> ()

  constructor(private http:HttpClient) { }
  
  filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    console.log('filet',value,this.fullInstrumentsLists);
    return this.fullInstrumentsLists.filter(option => option.toLowerCase().includes(filterValue));
  }
  getSecidLists (secidOnly: boolean) {
    const params = {'secidOnly':secidOnly}
   this.http.get <string[]> ('/api/AAM/InstrumentData/',{params:params}).subscribe (data=>{
     this.fullInstrumentsLists = data[0]['array_agg']
     this.sendSecIdList(this.fullInstrumentsLists);
   })
  }
   sendSecIdList ( dataSet:string[]) { //the component that wants to update something, calls this fn
    this.subjectSecIDList.next(dataSet); //next() will feed the value in Subject
  }
  recieveSecIdList(): Observable<string[]> { //the receiver component calls this function 
    return this.subjectSecIDList.asObservable(); //it returns as an observable to which the receiver funtion will subscribe
  }

    
 }
