import { Injectable } from '@angular/core';
import { HadlingCommonDialogsService } from './hadling-common-dialogs.service';
import { AppAccountingService } from './accounting.service';
import { EMPTY, Observable, Subject, catchError, filter, forkJoin, from, map, switchMap, tap } from 'rxjs';
import { bAccountTransaction, bLedgerTransaction } from '../models/interfaces.model';
import { AccountingTradesService } from './accounting-trades.service';
import { HttpClient } from '@angular/common/http';
import { formatNumber } from '@angular/common';
import { FeesMainData, FeesMainWithSchedules, FeesPortfoliosWithSchedulesData, FeesSchedulesData, FeesTransactions, ManagementFeeCalcData, PerformanceFeeCalcData, dFeesObject } from '../models/fees-interfaces.model';
@Injectable({
  providedIn: 'root'
})
export class AppFeesHandlingService {
  public feesCodes = ['','Management Fee', 'Performance Fee']
  public objectCodes = ['','Portfolio', 'Account']
  private feesToProcess:FeesTransactions[];
  private createdAccounting$ = new Subject <{}[]>
  private feesMainDataSub$ = new Subject<{data:FeesMainData[],action:string}>
  private feesSchedulesDataSub$ = new Subject<{data:FeesSchedulesData[],action:string}>
  private feeSheduleIsOpened$ = new Subject<number>
  private feePortfoliosWithSheduleIsOpened$ = new Subject<number>
  constructor(
    private http :HttpClient,
    private CommonDialogsService:HadlingCommonDialogsService,
    private AccountingDataService:AppAccountingService, 
    private accountingTradeService: AccountingTradesService,
  ) { }
  sendFeeSheduleIsOpened(id_fee_main: number) {
    console.log('send',id_fee_main);
    this.feeSheduleIsOpened$.next(id_fee_main);
  }
  getFeeSheduleIsOpened():Observable<number> {
    return this.feeSheduleIsOpened$.asObservable();
  }
  deleteFeesSchedulesCascade (id_fee_main:number):Observable<FeesSchedulesData> {
    return this.http.post <FeesSchedulesData> ('/api/AAM/updateFeesScheduleData/',{data:{id_fee_main:id_fee_main}, action:'Delete_Cascade'})
  }
  updatePortfoliosFeesData (data:FeesPortfoliosWithSchedulesData, action:string):Observable<dFeesObject> {
    return this.http.post <dFeesObject> ('/api/AAM/updatePortfoliosFeesData/',{data:data, action:action})
  }
  updateFeesMainData (data:FeesMainData, action:string):Observable<FeesMainData> {
    return this.http.post <FeesMainData> ('/api/AAM/updateFeesData/',{data:data, action:action})
  }
  updateFeesScheduleData (data:FeesSchedulesData, action:string):Observable<FeesSchedulesData[]> {
    return this.http.post <FeesSchedulesData[]> ('/api/AAM/updateFeesScheduleData/',{data:data, action:action})
  }
  recieveFeesPortfoliosWithSchedulesIsOpened():Observable<number>  {
    return this.feePortfoliosWithSheduleIsOpened$.asObservable()
  }
  sendFeesPortfoliosWithSchedulesIsOpened(id_portfolio:number)  {
    return this.feePortfoliosWithSheduleIsOpened$.next(id_portfolio);
  }
  getFeesPortfoliosWithSchedulesData (p_object_id:number)
  :Observable<FeesPortfoliosWithSchedulesData[]> {
    return this.http.get <FeesPortfoliosWithSchedulesData[]> ('/api/AAM/getFeesData/',{params:{p_object_id:p_object_id, action:'getFeesPortfoliosWithSchedulesData'}})
  }
  getFeesMainWithSchedulesData ()
  :Observable<FeesMainWithSchedules[]> {
    return this.http.get <FeesMainWithSchedules[]> ('/api/AAM/getFeesData/',{params:{action:'getFeesMainWithSchedulesData'}})
  }
  getFeesMainData ()
  :Observable<FeesMainData[]> {
    return this.http.get <FeesMainData[]> ('/api/AAM/getFeesData/',{params:{action:'getFeesMainData'}})
  }
  getFeesSchedulesData (id_fee:number)
  :Observable<FeesSchedulesData[]> {
    return this.http.get <FeesSchedulesData[]> ('/api/AAM/getFeesData/',{params:{id_fee:id_fee,action:'getFeesSchedulesData'}})
  }
  getFeeShedulessDataReload ():Observable<{data:FeesSchedulesData[],action:string}> {
    return this.feesSchedulesDataSub$.asObservable();
  }
  sendFeeShedulessDataReload (data:FeesSchedulesData[],action:string) {
    this.feesSchedulesDataSub$.next({data:data,action:action});
  }
  getFeesMainDataReload ():Observable<{data:FeesMainData[],action:string}> {
    return this.feesMainDataSub$.asObservable();
  }
  sendFeesMainDataReload (data:FeesMainData[],action:string) {
    this.feesMainDataSub$.next({data:data,action:action});
  }
  getPerformanceFeeCalcData (searchObj : {action:string,p_report_date_start:string,p_report_date_end:string, p_portfolios_list: string []})
  :Observable<PerformanceFeeCalcData[]> {
    searchObj.action='getPerformanceFeeCalcData';
    return this.http.get <PerformanceFeeCalcData[]> ('/api/AAM/getFeesData/',{params:searchObj})
  }
  getManagementFeeCalcData (searchObj : {action:string,p_report_date_start:string,p_report_date_end:string, p_portfolios_list: string []})
  :Observable<ManagementFeeCalcData[]> {
    searchObj.action='getManagementFeesCalcData';
    return this.http.get <ManagementFeeCalcData[]> ('/api/AAM/getFeesData/',{params:searchObj})
  }
  approvedPerformanceFeeCalc (searchObj : {action:string,p_report_date:string, p_portfolios_list: string []}):Observable <{f_f_insert_performance_fees:number}[]> {
    searchObj.action='approvedPerformanceFeeCalc';
    return this.http.get <{f_f_insert_performance_fees:number}[]> ('api/AAM/getFeesData/',{params:searchObj})
  }
  approvedManagementFeeCalc (searchObj : {action:string,p_report_date_start:string,p_report_date_end:string, p_portfolios_list: string []}):Observable <{f_f_insert_management_fees:number}[]> {
    searchObj.action='approvedManagementFeeCalc';
    return this.http.get <{f_f_insert_management_fees:number}[]> ('api/AAM/getFeesData/',{params:searchObj})
  }
  getFeesManagementTransactions (searchObj : {action:string,p_report_date_start:string,p_report_date_end:string, p_portfolios_list: string []}):Observable<FeesTransactions[]> {
    searchObj.action='getFeesManagementTransactions';
    return this.http.get <FeesTransactions[]> ('api/AAM/getFeesData/', {params:searchObj})
  }
  getFeesPerformanceTransactions (searchObj : {action:string,p_report_date_start:string,p_report_date_end:string, p_portfolios_list: string []}):Observable<FeesTransactions[]> {
    searchObj.action='getFeesPerformanceTransactions';
    return this.http.get <FeesTransactions[]> ('api/AAM/getFeesData/', {params:searchObj})
  }
  checkFeesTransWithEntries (ids:number[]):Observable<{id:number}[]> {
    let params = {
      action:'checkFeesTransWithEntries',
      ids_fees:ids
    }
    return this.http.get <{id:number}[]> ('api/AAM/getFeesData/',{params:params})
  }
  updateFeesEntryInfo (ids:number[],entry_id:number[],accounting_date:string): Observable<{qty:number}[]> {
    return this.http.post <{qty:number}[]> (
      'api/AAM/updateFeesEntryInfo/',
      {params: 
        {action:'updateFeesEntryInfo',
        ids:ids,
        entry_id:entry_id,
        accounting_date:accounting_date}
      })
  }
  deleteFeesCalculation (ids:number[]) {
    this.CommonDialogsService.confirmDialog('Delete selected calculations','Delete').pipe(
      filter(confirm=>confirm.isConfirmed),
      switchMap(()=>this.deleteFeesCalculationExec(ids)),
      catchError(err=>{
        console.log('error',err);
        this.CommonDialogsService.snackResultHandler(err.error);
        return EMPTY;
      })
    ).subscribe(data=>{
      this.CommonDialogsService.snackResultHandler({
        name:data['name'], 
        detail:data['name'] === 'error'? data['detail'] :  formatNumber (data.length,'en-US') + ' entries'}, 'Deleted '
      );
      data['name'] !== 'error'?  this.sendCreatedAccounting(data):null;
    })
  }
  deleteFeesCalculationExec (ids:number[]):Observable<FeesTransactions[]>{
    return this.http.post <FeesTransactions[]> ('api/AAM/updateFeesData/',{action:'Delete',data:{id:ids}})
  } 
  getProfitTax (p_date:string):Observable<{rate:number}[]> {
    return this.http.get <{rate:number}[]>('api/AAM/getTaxesData/',{params:{p_date:p_date}})
  }
  createAccountingForManagementFees (feesToProcessSet:FeesTransactions[],profitTax:number,accountingDate:Date) {
    this.feesToProcess = feesToProcessSet;
    let portfolioWithoutFunds = this.feesToProcess
    .filter(el=>Number(el.fee_type)===1? el.id===null&&el.account_balance<0:el.account_balance<0)
    .map(el=>el.portfolioname);
    this.checkFeesTransWithEntries (this.feesToProcess.filter(el=>el.id>0).map(el=>Number(el.id))).pipe(
      tap(feesWithEntries=>feesWithEntries.length?  
        this.CommonDialogsService.snackResultHandler({name:'error',detail:'There are created entries for the fee transactions: '+[...feesWithEntries.map(el=>el.id)]}) 
        : null),
      filter(entriesData=>entriesData.length===0),
      switchMap(()=>
      portfolioWithoutFunds.length>0? 
        this.CommonDialogsService.confirmDialog('Portfolios '+[...portfolioWithoutFunds] +' do not have enough funds.\n Fees will be deducted in overdraft','Confirm')
        : from ([{isConfirmed:true}])
      ),
      filter(confirm=>confirm.isConfirmed)
    ).subscribe(()=>this.entriesCreationForManagementFees(profitTax,accountingDate));
  }
  entriesCreationForManagementFees (profitTaxRate:number,accountingDate:Date) {
    let createdAccountingTransactions = [];
    let feesToProcessProcessStatus = this.feesToProcess.
    filter(el=>Number(el.fee_type)===1? el.id===null: el.id>0)
    .map(el=>{return {id:el.portfolioname,accounting:1}})
    this.feesToProcess.filter(el=>Number(el.fee_type)===1? el.id===null: el.id>0).forEach(feeTransaction => {
      let bcEntryParameters = <any> {}
      bcEntryParameters.fee_code=feeTransaction.fee_code;
      bcEntryParameters.pDate_T=new Date(accountingDate).toDateString();
      bcEntryParameters.pAccountId=feeTransaction.accountId;
      bcEntryParameters.p_fee_amount=feeTransaction.fee_amount;
      bcEntryParameters.p_tax_amount=Math.round(feeTransaction.fee_amount*profitTaxRate)/100;
      bcEntryParameters.p_net_profit=feeTransaction.fee_amount-bcEntryParameters.p_tax_amount;
      bcEntryParameters.portfolioname=feeTransaction.portfolioname;
      bcEntryParameters.endPeriod=new Date(feeTransaction.endPeriod).toLocaleDateString();
      bcEntryParameters.startPeriod=new Date(feeTransaction.startPeriod).toLocaleDateString();
      bcEntryParameters.fee_date=new Date(feeTransaction.fee_date).toLocaleDateString();
      let cSchemeGroupId:string = '';
      switch (feeTransaction.fee_type.toString()) {
        case '1':
          cSchemeGroupId='Managment_Fee'
        break;
        case '2':
          cSchemeGroupId='Performance_Fee'
        break;
      };
     let accountingToCreate$: Observable<bAccountTransaction[]|bLedgerTransaction[]>[]=[];
     forkJoin([
       this.accountingTradeService.getAccountingScheme(bcEntryParameters,cSchemeGroupId).pipe(
         map(entryDrafts=>entryDrafts.forEach(draft=>
           accountingToCreate$.push(this.AccountingDataService.updateEntryAccountAccounting (draft,'Create'))
         )),
       ),
       this.accountingTradeService.getAccountingScheme(bcEntryParameters,cSchemeGroupId,'LL').pipe(
         map(entryDrafts=>entryDrafts.forEach(draft=>{
           accountingToCreate$.push(this.AccountingDataService.updateLLEntryAccountAccounting (draft,'Create'))
         }))
       )
     ]).pipe(
      switchMap(()=>forkJoin(accountingToCreate$)),
      tap(data=>createdAccountingTransactions.push(data)),
      map(el=>el.flat().map(el=>Number(el.id))),
      switchMap(data=>this.updateFeesEntryInfo(
        this.feesToProcess.filter(el=>el.id>0&&el.portfolioname===feeTransaction.portfolioname).map(el=>Number(el.id)),
        ((data as unknown) as number[]),
        new Date(accountingDate).toLocaleDateString()
        )),
      catchError((err) => {
        console.log('err',err);
        this.CommonDialogsService.snackResultHandler(err.error)
        return EMPTY
      })
     )
     .subscribe(data=>{
      let index = feesToProcessProcessStatus.findIndex(el=>el.id===feeTransaction.portfolioname);
      index!==-1? feesToProcessProcessStatus[index].accounting=0 : null;
      this.createMFAccountingStatus(feesToProcessProcessStatus,createdAccountingTransactions)
     });
      })
  } 
  createMFAccountingStatus (tradeToConfirmProcessStatus:{id:string,accounting:number}[],createdAccountingTransactions:any[]) {
    if (tradeToConfirmProcessStatus.reduce((acc,val)=>acc+val.accounting,0)===0) {
      this.sendCreatedAccounting(createdAccountingTransactions)
      let entries = new Set (createdAccountingTransactions.flat().map(el=>el[0]['id']))
      this.CommonDialogsService.snackResultHandler({name:'success',detail:''+entries.size + ' entries.'},'Accounting has been created ',undefined,false);
    }
  }
  getCreatedAccounting ():Observable<{}[]>   {
    return this.createdAccounting$.asObservable()
  }
  sendCreatedAccounting (createdTransactions:{}[]) {
    this.createdAccounting$.next(createdTransactions);
  }
  deleteEntriesForMFeesTransactions(entries_ids:number[]):Observable<{id:number}[]> {
    return this.http.post <{id:number}[]> ('api/AAM/updateFeesEntryInfo/',{params:{action:'deleteMFAccounting',entries_ids:entries_ids}})
  }
  deleteMFAccounting (feesToProcessSet:FeesTransactions[]){
    let a = feesToProcessSet.filter(el=>el.id_b_entry1!=null).map(el=>el.id_b_entry1).flat().map(el=>Number(el));
    let entriesToDelete = [...new Set (a)]
    if (entriesToDelete.length===0) {return this.CommonDialogsService.snackResultHandler({name:'error',detail:'There is no accounting to delete'})};
    this.CommonDialogsService.confirmDialog('Delete accounting for the selected fees transactions ','Delete').pipe(
      filter (isConfirmed => isConfirmed.isConfirmed),
      switchMap(()=>this.deleteEntriesForMFeesTransactions(entriesToDelete)),
      catchError((err) => {
        console.log('err',err);
        this.CommonDialogsService.snackResultHandler(err.error)
        return EMPTY
      })
    ).subscribe(data=>{
      this.CommonDialogsService.snackResultHandler({
        name:data['name'], 
        detail:data['name'] === 'error'? data['detail'] :  formatNumber (data[0]['f_f_remove_accounting_ref_management_fees'].length,'en-US') + ' entries'}, 'Deleted '
      );
      this.sendCreatedAccounting(data)
    })
  }
}
