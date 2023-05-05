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
    return this.fullInstrumentsLists.filter(option => option.toLowerCase().includes(filterValue));
  }
  getSecidLists (Action: string) {
    const params = {Action:Action}
    this.http.get <string[]> ('/api/AAM/MD/getMoexInstruments/',{params:params}).subscribe (data=>{
      this.fullInstrumentsLists = data[0]['array_agg']
      this.sendSecIdList(this.fullInstrumentsLists);
   })
  }
  sendSecIdList ( dataSet:string[]) { 
    this.subjectSecIDList.next(dataSet); 
  }
  recieveSecIdList(): Observable<string[]> { 
    return this.subjectSecIDList.asObservable(); 
  }
 }
