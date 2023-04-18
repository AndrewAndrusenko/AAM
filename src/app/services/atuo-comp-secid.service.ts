import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AtuoCompSecidService {
  public fullInstrumentsLists :string [] =[];
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
   })
    
  }
}