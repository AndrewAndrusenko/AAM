import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { Subject, exhaustMap, tap } from 'rxjs';
import { cacheAAM, indexDBService } from './indexDB.service';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { StrategiesGlobalData, counterParty, currencyCode, currencyPair, currencyRateList } from '../models/interfaces.model';
@Injectable({
  providedIn: 'root'
})
export class AtuoCompleteService {
  fullInstrumentsLists: string[][] = [];
  fullCurrenciesList: currencyCode[] = [];
  fullCounterPatiesList: counterParty[] = [];
  fullCurrencyPairsList: currencyPair[] = [];
  derivatives:{secid:string}[]=[];
  private subjectSecIDList = new Subject<string[][]>();
  private subSecID = new Subject<boolean>();
  private subCurrencyList = new Subject<boolean>();
  public subModelPortfoliosList = new Subject<boolean>();
  private subDerivativesList = new Subject<boolean>();
  private subCurrencyListReady = new Subject<boolean>();
  private subSecIdListReady = new Subject<boolean>();
  private subMPsListReady = new Subject<StrategiesGlobalData[]>();

  constructor(
    private indexDBService: indexDBService
  ) {
    this.subDerivativesList.pipe(
      exhaustMap(()=>this.indexDBService.getIndexDBStaticTables('getInstrumentFutures')))
    .subscribe(data=>this.derivatives=(data.data as {secid:string}[]))
    this.subModelPortfoliosList.pipe (
      exhaustMap(()=>this.indexDBService.getIndexDBStaticTables('getModelPortfolios')),
    ).subscribe((data) => this.subMPsListReady.next(data.data as StrategiesGlobalData[]));
   }

  filterList(value: string, type: string):  string[][]|string[]|currencyCode[]|currencyRateList[]|currencyPair[]|counterParty[] {
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
      exhaustMap(()=>this.indexDBService.getIndexDBStaticTables('getInstrumentAutoCompleteList')),
    ).subscribe(data => {
      this.subDerivativesList.next(true);
      this.fullInstrumentsLists = (data.data as string[][]);
      this.sendSecIdList(this.fullInstrumentsLists);
      this.sendSecIdListReady(true);
    });
  }
  createCurrencypipe (){
    this.subCurrencyList.pipe (
      exhaustMap(()=>this.indexDBService.getIndexDBStaticTables('getCurrencyCodes')),
    ).subscribe(data => {
      this.fullCurrenciesList = (data.data as currencyCode[]);
      this.subCurrencyListReady.next(true)
    });
  }
  getSMPsListReady(): Observable<StrategiesGlobalData[]> {
    return this.subMPsListReady.asObservable();
  }
  getSecidLists() {
    this.subSecID.next(true);
  }
  getCounterpartyLists():Observable<counterParty[]> {
    return this.indexDBService.getIndexDBStaticTables('getCounterPartyList').pipe(
      tap(data => this.fullCounterPatiesList = (data as cacheAAM).data as counterParty[])
    ) as Observable<counterParty[]>
  }
  getCurrencyList() {
     this.subCurrencyList.next(true);
  }
  getCurrencyPairsList() {
    return this.indexDBService.getIndexDBStaticTables('getCurrencyPairsList').subscribe(data => {
      this.fullCurrencyPairsList = data.data as currencyPair[];
    });
  }
  currencyValirator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors => {
      return (this.fullCurrenciesList.filter(el => el['CurrencyCodeNum'] === control.value).length ? null : { currencyCode: true });
    };
  }
  getCurrecyData(codeNum: string): currencyCode {
    return this.fullCurrenciesList.filter(el => el.CurrencyCodeNum.toString() === codeNum)[0];
  }
  secidValirator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors => {
      return (this.fullInstrumentsLists.filter(el => el[0] === control.value).length||this.derivatives.filter(el => el.secid === control.value).length ?  
      null : { noSecid: true });
    };
  }
  counterPartyalirator(sec_name: AbstractControl): ValidatorFn {
    return (control: AbstractControl): ValidationErrors => {
      let cpty = this.fullCounterPatiesList.filter(el => Number(el['idclient']) == Number(control.value));
      sec_name.patchValue(cpty.length ? cpty[0]['clientname'] : 'Not found!');
      return (cpty.length ? null : { noCounterParty: true });
    };
  }
  sendSecIdList(dataSet: string[][]) {
    this.subjectSecIDList.next(dataSet);
  }
  recieveSecIdList(): Observable<string[][]> {
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
