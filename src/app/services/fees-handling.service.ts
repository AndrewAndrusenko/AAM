import { Injectable } from '@angular/core';
import { HadlingCommonDialogsService } from './hadling-common-dialogs.service';
import { AppAccountingService } from './accounting.service';
import { EMPTY, Observable, Subject, catchError, filter, forkJoin, from, map, switchMap, tap } from 'rxjs';
import { FeesTransactions, ManagementFeeCalcData, bAccountTransaction, bLedgerTransaction } from '../models/intefaces.model';
import { AccountingTradesService } from './accounting-trades.service';
import { HttpClient } from '@angular/common/http';
import { formatNumber } from '@angular/common';
@Injectable({
  providedIn: 'root'
})
export class AppFeesHandlingService {
  private feesToProcess:FeesTransactions[];
  private createdAccounting$ = new Subject <{}[]>
  constructor(
    private http :HttpClient,
    private CommonDialogsService:HadlingCommonDialogsService,
    private AccountingDataService:AppAccountingService, 
    private accountingTradeService: AccountingTradesService,
  ) { }
  getManagementFeeCalcData (searchObj : {action:string,p_report_date_start:string,p_report_date_end:string, p_portfolios_list: string []})
  :Observable<ManagementFeeCalcData[]> {
    searchObj.action='getManagementFeesCalcData';
    return this.http.get <ManagementFeeCalcData[]> ('/api/AAM/getFeesData/',{params:searchObj})
  }
  approvedManagementFeeCalc (searchObj : {action:string,p_report_date_start:string,p_report_date_end:string, p_portfolios_list: string []}):Observable <{f_f_insert_management_fees:number}[]> {
    searchObj.action='approvedManagementFeeCalc';
    return this.http.get <{f_f_insert_management_fees:number}[]> ('api/AAM/getFeesData/',{params:searchObj})
  }
  getFeesTransactions (searchObj : {action:string,p_report_date_start:string,p_report_date_end:string, p_portfolios_list: string []}):Observable<FeesTransactions[]> {
    searchObj.action='getFeesTransactions';
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
    let portfolioWithoutFunds = this.feesToProcess.filter(el=>el.id===null&&el.calculation_base<0).map(el=>el.portfolioname);
    this.checkFeesTransWithEntries (this.feesToProcess.filter(el=>el.id>0).map(el=>Number(el.id))).pipe(
      tap(feesWithEntries=>feesWithEntries.length?  
        this.CommonDialogsService.snackResultHandler({name:'error',detail:'There are created entries for the fee transactions: '+[...feesWithEntries.map(el=>el.id)]}) : null),
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
    let feesToProcessProcessStatus = this.feesToProcess.filter(el=>el.id===null).map(el=>{return {id:el.portfolioname,accounting:1}})
    this.feesToProcess.filter(el=>el.id===null).forEach(feeTransaction => {
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
