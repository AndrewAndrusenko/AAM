import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { Subject, exhaustMap, filter, map, observable, of, shareReplay, tap } from 'rxjs';
import { cacheAAM, indexDBService } from './indexDB.service';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { StrategiesGlobalData, counterParty, countriesData, currencyCode, currencyPair, currencyRateList } from '../models/interfaces.model';
import { Stream } from 'stream';
@Injectable({
  providedIn: 'root'
})
export class AtuoCompleteService {
  fullInstrumentsLists: string[][] = [];
  fullCurrenciesList: currencyCode[] = [];
  fullCounterPatiesList: counterParty[] = [];
  fullCurrencyPairsList: currencyPair[] = [];
  derivatives:{secid:string}[]=[];
  public subSecIdList = new Subject<boolean>();
  public subCurrencyList = new Subject<boolean>();
  public subCountries = new Subject <countriesData[]> ();
  public subModelPortfolios = new Subject<StrategiesGlobalData[]>();
  private subDerivativesList = new Subject<boolean>();
  constructor(
    private indexDBService: indexDBService
  ) 
  {
    this.subModelPortfolios
      .pipe(
        exhaustMap(()=>this.indexDBService.getIndexDBStaticTables('getModelPortfolios')),
        map(data=>data.data as StrategiesGlobalData[]),
        shareReplay(1)
      )
      .subscribe(data=>this.subModelPortfolios.next(data));
    this.subDerivativesList
      .pipe(exhaustMap(()=>this.indexDBService.getIndexDBStaticTables('getInstrumentFutures')))
      .subscribe(data=>this.derivatives=(data.data as {secid:string}[]));
    this.subCountries
      .pipe(
        exhaustMap(()=>this.indexDBService.getIndexDBStaticTables('getCountriesData')),
        shareReplay(1)
      )
      .subscribe(data=>this.subCountries.next(data.data as countriesData[]));
    this.subSecIdList
      .pipe(exhaustMap(()=>this.indexDBService.getIndexDBStaticTables('getInstrumentAutoCompleteList')))
      .subscribe(data => {
        this.subDerivativesList.next(true);
        this.fullInstrumentsLists = (data.data as string[][]);
        this.subSecIdList.next(true);
      });
    this.subCurrencyList
      .pipe (exhaustMap(()=>this.indexDBService.getIndexDBStaticTables('getCurrencyCodes')))
      .subscribe(data => {
        this.fullCurrenciesList = (data.data as currencyCode[]);
        this.subCurrencyList.next(true)
      });
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
  getCounterpartyLists():Observable<counterParty[]> {
    return this.indexDBService.getIndexDBStaticTables('getCounterPartyList').pipe(
      tap(data => this.fullCounterPatiesList = (data as cacheAAM).data as counterParty[])
    ) as Observable<counterParty[]>
  }
  getCurrencyPairsList() {
    return this.indexDBService.getIndexDBStaticTables('getCurrencyPairsList').subscribe(data => {
      this.fullCurrencyPairsList = data.data as currencyPair[];
    });
  }
  getCurrecyData(codeNum: string): currencyCode {
    return this.fullCurrenciesList.filter(el => el.CurrencyCodeNum.toString() === codeNum)[0];
  }
  currencyValirator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors => {
      return (this.fullCurrenciesList.filter(el => el['CurrencyCodeNum'] === control.value).length ? null : { currencyCode: true });
    };
  }
  secidValirator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors => {
      return (this.fullInstrumentsLists.length===0||this.fullInstrumentsLists.filter(el => el[0] === control.value).length||this.derivatives.filter(el => el.secid === control.value).length ?  
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
}