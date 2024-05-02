import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { dRestrictionsObjects, restrictionVerificationAllocation, restrictionsData, restrictionsVerification } from '../models/restrictions-interfaces.model';
@Injectable({
  providedIn: 'root'
})
export class AppRestrictionsHandlingService {
  private restrictionsDataReloadSub$ = new Subject<{data:restrictionsData[],action:string}>

  constructor(
    private http :HttpClient,
  ) { }
  getRestrictionsDataMain (p_idportfolios:number[]|null,p_portfolios_codes=null) :Observable<restrictionsData[]> {
    return this.http.get <restrictionsData[]> ('/api/AAM/getRestrictionsData/',{withCredentials: true,params:{
      action:'getRestrictionsDataMain',
      p_idportfolios:p_idportfolios,
      p_portfolios_codes:p_portfolios_codes
    }})
  }
  getRestrictionsVerification (p_portfolios_codes:string[]) :Observable<restrictionsVerification[]> {
    return this.http.get <restrictionsVerification[]> ('/api/AAM/getRestrictionsData/',{withCredentials: true,params:{
      action:'getRestrictionsVerification',
      p_portfolios_codes:p_portfolios_codes
    }})
  }
  getVerificationForAllocation (p_trade_price:number,p_alloc_secid:string,ordersForExecution:number[],qtyForAllocation:number) :Observable<restrictionVerificationAllocation[]> {
    return this.http.get <restrictionVerificationAllocation[]> ('/api/AAM/getRestrictionsData/',{withCredentials: true,params:{
      action:'getVerificationForAllocation',
      p_trade_price:p_trade_price,
      p_alloc_secid: p_alloc_secid,
      p_verification_type: 0,
      ordersForExecution:ordersForExecution,
      qtyForAllocation:qtyForAllocation
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
