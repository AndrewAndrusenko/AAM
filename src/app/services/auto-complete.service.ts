import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { Subject, Subscription, exhaustMap, tap } from 'rxjs';
import { indexDBService } from './indexDB.service';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Stream } from 'stream';

@Injectable({
  providedIn: 'root'
})
export class AtuoCompleteService {
  fullInstrumentsLists: string[] = [];
  fullCurrenciesList: string[] = [];
  fullCounterPatiesList: string[] = [];
  fullCurrencyPairsList: string[] = [];
  private subjectSecIDList = new Subject<string[]>();
  private subSecID = new Subject ();
  private subCurrencyList = new Subject ();
  private subCurrencyListReady = new Subject<boolean> ();
  private subSecIdListReady = new Subject<boolean> ();
  constructor(
    private indexDBServiceS: indexDBService
  ) { }

  filterList(value: string, type: string): string[] {
    const filterValue = value.toString().toLowerCase();
    switch (type) {
      case 'secid': return this.fullInstrumentsLists.filter(option => option.toString().toLowerCase().includes(filterValue));
      case 'currency': return this.fullCurrenciesList.filter(option => JSON.stringify(Object.values(option)).toLowerCase().includes(filterValue));
      case 'cpty': return this.fullCounterPatiesList.filter(option => JSON.stringify(Object.values(option)).toLowerCase().includes(filterValue));
      case 'currencyPairs': return this.fullCurrencyPairsList.filter(option => JSON.stringify(Object.values(option)).toLowerCase().includes(filterValue));
      default: return [];
    }
  }
  createSecIDpipe (){
    this.subSecID.pipe (
      exhaustMap(()=>this.indexDBServiceS.getIndexDBStaticTables('getInstrumentAutoCompleteList')),
    ).subscribe(data => {
      this.fullInstrumentsLists = data['data'];
      this.sendSecIdList(this.fullInstrumentsLists);
      this.sendSecIdListReady(true);
    });
  }
  createCurrencypipe (){
    this.subCurrencyList.pipe (
      exhaustMap(()=>this.indexDBServiceS.getIndexDBStaticTables('getCurrencyCodes')),
    ).subscribe(data => {
      this.fullCurrenciesList = data['data'];
      this.subCurrencyListReady.next(true)
    });
  }
  getSecidLists() {
    this.subSecID.next(true);
    
  }
  getCounterpartyLists() {
    return this.indexDBServiceS.getIndexDBStaticTables('getCounterPartyList').then(data => this.fullCounterPatiesList = data['data']);
  }
  getCurrencyList() {
     this.subCurrencyList.next(true);
  }
  getCurrencyPairsList() {
    return this.indexDBServiceS.getIndexDBStaticTables('getCurrencyPairsList').then(data => {
      this.fullCurrencyPairsList = data['data'];
    });
  }
  currencyValirator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors => {
      return (this.fullCurrenciesList.filter(el => el['CurrencyCodeNum'] === control.value).length ? null : { currencyCode: true });
    };
  }
  getCurrecyData(codeNum: string): string {
    return this.fullCurrenciesList.filter(el => el['CurrencyCodeNum'] === codeNum)[0];
  }
  secidValirator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors => {
      return (this.fullInstrumentsLists.filter(el => el[0] === control.value).length ? null : { noSecid: true });
    };
  }
  counterPartyalirator(sec_name: AbstractControl): ValidatorFn {
    return (control: AbstractControl): ValidationErrors => {
      let cpty = this.fullCounterPatiesList.filter(el => Number(el['idclient']) == Number(control.value));
      sec_name.patchValue(cpty.length ? cpty[0]['clientname'] : 'Not found!');
      return (cpty.length ? null : { noCounterParty: true });
    };
  }
  sendSecIdList(dataSet: string[]) {
    this.subjectSecIDList.next(dataSet);
  }
  recieveSecIdList(): Observable<string[]> {
    return this.subjectSecIDList.asObservable();
  }
  sendCurrencyListReady(ready:boolean) {
    this.subCurrencyListReady.next(ready);
  }
  recieveCurrencyListReady(): Observable<boolean> {
    return this.subCurrencyListReady.asObservable();
  }
  sendSecIdListReady(ready:boolean) {
    this.subSecIdListReady.next(ready);
  }
  recieveSecIdListReady(): Observable<boolean> {
    return this.subSecIdListReady.asObservable();
  }

}
