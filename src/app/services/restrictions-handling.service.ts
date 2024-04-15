import { Injectable } from '@angular/core';
import { HadlingCommonDialogsService } from './hadling-common-dialogs.service';
import { Observable, Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { dRestrictionsObjects, restrictionsData } from '../models/restrictions-interfaces.model';
@Injectable({
  providedIn: 'root'
})
export class AppRestrictionsHandlingService {
  private restrictionsDataReloadSub$ = new Subject<{data:restrictionsData[],action:string}>

  constructor(
    private http :HttpClient,
    // private CommonDialogsService:HadlingCommonDialogsService,
  ) { }
/*   sendFeeSheduleIsOpened(id_fee_main: number) {
    this.feeSheduleIsOpened$.next(id_fee_main);
  }
  getFeeSheduleIsOpened():Observable<number> {
    return this.feeSheduleIsOpened$.asObservable();
  }
  deleteFeesSchedulesCascade (id_fee_main:number):Observable<FeesSchedulesData> {
    return this.http.post <FeesSchedulesData> ('/api/AAM/updateFeesScheduleData/',{data:{id_fee_main:id_fee_main}, action:'Delete_Cascade'})
  }
  updatePortfoliosFeesData (data:FeesPortfoliosWithSchedulesData, action:string):Observable<dFeesObject[]> {
    return this.http.post <dFeesObject[]> ('/api/AAM/updatePortfoliosFeesData/',{data:data, action:action})
  }
  updateFeesMainData (data:FeesMainData, action:string):Observable<FeesMainData[]> {
    return this.http.post <FeesMainData[]> ('/api/AAM/updateFeesData/',{data:data, action:action})
  }
  updateFeesScheduleData (data:FeesSchedulesData, action:string):Observable<FeesSchedulesData[]> {
    return this.http.post <FeesSchedulesData[]> ('/api/AAM/updateFeesScheduleData/',{data:data, action:action})
  }
  recieveFeesPortfoliosWithSchedulesIsOpened():Observable<{id:number,rewriteDS:boolean}[]>  {
    return this.feePortfoliosWithSheduleIsOpened$.asObservable()
  }
  sendFeesPortfoliosWithSchedulesIsOpened(id_portfolio:number,rewriteDS:boolean)  {
    console.log('sent',id_portfolio);

    return this.feePortfoliosWithSheduleIsOpened$.next([{id:id_portfolio,rewriteDS:rewriteDS}]);
  }
  recieveFeesPortfoliosWithSchedulesReload ():Observable<{data:dFeesObject[],action:string}> {
    return this.feesPortfoliosScheduleDataSub$.asObservable();
  }
  sendFeesPortfoliosWithSchedulesReload (data:dFeesObject[],action:string) {
    this.feesPortfoliosScheduleDataSub$.next({data:data,action:action});
  }
  getFeesPortfoliosWithSchedulesData (p_object_id:number,p_id_fee_main:number)
  :Observable<FeesPortfoliosWithSchedulesData[]> {
    return this.http.get <FeesPortfoliosWithSchedulesData[]> ('/api/AAM/getFeesData/',{params:{p_object_id:p_object_id,p_id_fee_main:p_id_fee_main, action:'getFeesPortfoliosWithSchedulesData'}})
  } */
  getRestrictionsDataMain (p_idportfolios:number[]|null,p_portfolios_codes=null) :Observable<restrictionsData[]> {
    return this.http.get <restrictionsData[]> ('/api/AAM/getRestrictionsData/',{params:{
      action:'getRestrictionsDataMain',
      p_idportfolios:p_idportfolios,
      p_portfolios_codes:p_portfolios_codes
    }})
  }
  getRestrictionsObjects () :Observable<dRestrictionsObjects[]> {
    return this.http.get <dRestrictionsObjects[]> ('/api/AAM/getRestrictionsData/',{params:{action:'getRestrictionsObjects'}})
  }
  updateRestrictionMainData (data:restrictionsData,action:string):Observable<restrictionsData[]> {
    return this.http.post<restrictionsData[]>('/api/AAM/updateRestrictionsData/',{action:action,data:data})
  }
  recieveRestrictionsDataMainReload ():Observable<{data:restrictionsData[],action:string}> {
    return this.restrictionsDataReloadSub$.asObservable();
  }
  sendRestrictionsDataMainReload (data:restrictionsData[],action:string) {
    this.restrictionsDataReloadSub$.next({data:data,action:action});
  }
}
