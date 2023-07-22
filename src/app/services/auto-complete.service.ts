import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { indexDBService } from './indexDB.service';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

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
      case 'secid': return this.fullInstrumentsLists.filter(option => option.toString().toLowerCase().includes(filterValue));

      case 'currency': return this.fullCurrenciesList.filter(option => JSON.stringify(Object.values(option)).toLowerCase().includes(filterValue));
      default: return [];
    }
  }
  getSecidLists () {
    // const params = {Action:Action}
    this.indexDBServiceS.getIndexDBStaticTables('getInstrumentAutoCompleteList').then (data=>{
      this.fullInstrumentsLists = data['data']
      this.sendSecIdList(this.fullInstrumentsLists);
   })
  }
  getCurrencyList () {
    this.indexDBServiceS.getIndexDBStaticTables('getCurrencyCodes').then(data=> {
      this.fullCurrenciesList = data['data']
      this.sendCurrencyList(this.fullCurrenciesList);
   })
  }
  currencyValirator ():ValidatorFn {
    return (control:AbstractControl): ValidationErrors => {
      return (this.fullCurrenciesList.filter(el=>el['CurrencyCodeNum']===control.value).length? null:{currencyCode:true})
    }
  }
  secidValirator ():ValidatorFn {
    return (control:AbstractControl): ValidationErrors => {
      return (this.fullInstrumentsLists.filter(el=>el[0]===control.value).length? null:{noSecid:true})
    }
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
