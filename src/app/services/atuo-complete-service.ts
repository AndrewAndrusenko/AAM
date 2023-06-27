import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { indexDBService } from './indexDB.service';

@Injectable({
  providedIn: 'root'
})
export class AtuoCompleteService {
  fullInstrumentsLists :string [] =[];
  fullCurrenciesList :string [] =[];
  private subjectSecIDList = new Subject<string[]> ()
  private subjectCurrencyList = new Subject<string[]> ()

  constructor(
    private http:HttpClient,
    private indexDBServiceS:indexDBService,
    ) { }
  
  filterList(value: string, type:string): string[] {
    const filterValue = value.toLowerCase();
    switch (type) {
      case 'secid': return this.fullInstrumentsLists.filter(option => option.toLowerCase().includes(filterValue));
      case 'currency': return this.fullCurrenciesList.filter(option => option['CurrencyCodeNum'].toLowerCase().includes(filterValue));
      default: return [];
    }
  }
  getSecidLists (Action: string) {
    const params = {Action:Action}
    this.http.get <string[]> ('/api/AAM/MD/getMoexInstruments/',{params:params}).subscribe (data=>{
      this.fullInstrumentsLists = data[0]['array_agg']
      this.sendSecIdList(this.fullInstrumentsLists);
   })
  }
  getCurrencyList () {
    this.indexDBServiceS.getIndexDBInstrumentStaticTables('getCurrencyCodes').then(data=> {
      this.fullCurrenciesList = data['data']
      this.sendCurrencyList(this.fullCurrenciesList);
   })
  }
  sendSecIdList (dataSet:string[]) { 
    this.subjectSecIDList.next(dataSet); 
  }
  recieveSecIdList(): Observable<string[]> { 
    return this.subjectSecIDList.asObservable(); 
  }
  sendCurrencyList (dataSet:string[]) { 
    this.subjectCurrencyList.next(dataSet); 
  }
  recieveCurrencyList(): Observable<string[]> { 
    return this.subjectCurrencyList.asObservable(); 
  }

 }
