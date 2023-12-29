import { Injectable } from '@angular/core';
import { HadlingCommonDialogsService } from './hadling-common-dialogs.service';
import { AppAccountingService } from './accounting.service';
import { AppallocationTableComponent } from '../components/tables/allocation-table.component/allocation-table.component';
import { EMPTY, Observable, Subject, catchError, filter, forkJoin, map, switchMap, tap } from 'rxjs';
import { AbstractControl } from '@angular/forms';
import { AppOrderTableComponent } from '../components/tables/orders-table.component/orders-table.component';
import { FeesTransactions, ManagementFeeCalcData, bAccountTransaction, bLedgerTransaction } from '../models/intefaces.model';
import { AccountingTradesService } from './accounting-trades.service';
import { HttpClient } from '@angular/common/http';

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
  updateFeesEntryInfo (ids:number[],entry_id:number): Observable<{qty:number}[]> {
    console.log('ids and entry',ids,entry_id);
    return this.http.post <{qty:number}[]> (
      'api/AAM/updateFeesEntryInfo/',
      {params: 
        {action:'updateFeesEntryInfo',
        ids:ids,
        entry_id:entry_id}
      })
  }
  deleteFeesCalculation(ids:number[]):Observable<FeesTransactions[]>{
    console.log('ids',ids);
    return this.http.post <FeesTransactions[]> ('api/AAM/updateFeesData/',{action:'Delete',data:{id:ids}})
  } 
  getProfitTax (p_date:string):Observable<{rate:number}[]> {
    return this.http.get <{rate:number}[]>('api/AAM/getTaxesData/',{params:{p_date:p_date}})
  }
  createAccountingForManagementFees (feesToProcessSet:FeesTransactions[],profitTax:number) {
    this.feesToProcess = feesToProcessSet;
    this.checkFeesTransWithEntries (this.feesToProcess.filter(el=>el.id>0).map(el=>Number(el.id))).pipe(
      tap(feesWithEntries=>feesWithEntries.length?  
        this.CommonDialogsService.snackResultHandler({name:'error',detail:'There are created entries for the fee transactions: '+[...feesWithEntries.map(el=>el.id)]}) : null),
      filter(entriesData=>entriesData.length===0)
    ).subscribe(()=>this.entriesCreationForManagementFees(profitTax))
  }
  entriesCreationForManagementFees (profitTaxRate:number) {
    let createdAccountingTransactions = [];
    let feesToProcessProcessStatus = this.feesToProcess.filter(el=>el.id===null).map(el=>{return {id:el.portfolioname,accounting:1}})
    this.feesToProcess.filter(el=>el.id===null).forEach(feeTransaction => {
      let bcEntryParameters = <any> {}
      bcEntryParameters.fee_code=feeTransaction.fee_code;
      bcEntryParameters.pDate_T=new Date().toDateString();
      bcEntryParameters.pAccountId=feeTransaction.accountId;
      bcEntryParameters.p_fee_amount=feeTransaction.fee_amount;
      bcEntryParameters.p_tax_amount=Math.round(feeTransaction.fee_amount*profitTaxRate)/100;
      bcEntryParameters.p_net_profit=feeTransaction.fee_amount-bcEntryParameters.p_tax_amount;
      bcEntryParameters.portfolioname=feeTransaction.portfolioname;
      bcEntryParameters.endPeriod=new Date(feeTransaction.endPeriod).toLocaleDateString();
      bcEntryParameters.startPeriod=new Date(feeTransaction.startPeriod).toLocaleDateString();
      let cSchemeGroupId:string = '';
      console.log('feeTr',feeTransaction);
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
      switchMap(data=>this.updateFeesEntryInfo(
        this.feesToProcess.filter(el=>el.id>0&&el.portfolioname===feeTransaction.portfolioname).map(el=>Number(el.id)),
        data.filter(el=>Object.hasOwn(el[0],'accountId')==true)[0][0]['id'])),
      catchError((err) => {
        console.log('err',err);
        this.CommonDialogsService.snackResultHandler(err.error)
        return EMPTY
      })
     ).subscribe(data=>{
      let index = feesToProcessProcessStatus.findIndex(el=>el.id===feeTransaction.portfolioname);
      index!==-1? feesToProcessProcessStatus[index].accounting=0 : null;
      this.createMFAccountingStatus(feesToProcessProcessStatus,createdAccountingTransactions)

     });
      })
  } 

  createMFAccountingStatus (tradeToConfirmProcessStatus:{id:string,accounting:number}[],createdAccountingTransactions:any[]) {
    console.log('tradeToConfirmProcessStatus',tradeToConfirmProcessStatus);
    if (tradeToConfirmProcessStatus.reduce((acc,val)=>acc+val.accounting,0)===0) {
      this.sendCreatedAccounting(createdAccountingTransactions)
      this.CommonDialogsService.snackResultHandler({name:'success',detail:'Accounting has been created'},'Management Fees Accounting',undefined,false);
    }
  }

    getCreatedAccounting ():Observable<{}[]>   {
      return this.createdAccounting$.asObservable()
    }
    sendCreatedAccounting (createdTransactions:{}[]) {
      this.createdAccounting$.next(createdTransactions);
    }
  deleteAccountingForAllocatedTrades (feesToProcessTable:AppallocationTableComponent){
    let tradesToDelete = feesToProcessTable.selection.selected.map(trade=>Number(trade.id))
    if (!tradesToDelete.length) {
      return this.CommonDialogsService.snackResultHandler({name:'error',detail:'No trades are selected to be deleted'},'Delete Allocation Accounting')
    }
    this.AccountingDataService.GetbParamsgfirstOpenedDate('GetbParamsgfirstOpenedDate').pipe(
      tap (data =>{
        if (feesToProcessTable.selection.selected.filter(el=>el.tdate<data[0].FirstOpenedDate).length) {
          return this.CommonDialogsService.snackResultHandler({name:'error',detail:'Trades with entries in closed period have been selected. Entires in closed period can not been deleted'},'Delete Allocation Accounting',undefined,false);
        }
      }),
      filter(data=>feesToProcessTable.selection.selected.filter(el=>el.tdate<data[0].FirstOpenedDate).length===0),
      switchMap(()=>this.CommonDialogsService.confirmDialog('Delete accouting for allocated trades ')),
      filter (isConfirmed => isConfirmed.isConfirmed),
      switchMap(() => this.AccountingDataService.deleteAccountingAndFIFOtransactions (tradesToDelete))  
    ).subscribe (deletedTrades=>{
      feesToProcessTable.selection.clear();
      let result = deletedTrades['name']==='error'? deletedTrades : {name:'success',detail:'Accounting and FIFO have been deleted'};
      this.CommonDialogsService.snackResultHandler(result,'Delete accounting: ',undefined,false)
      feesToProcessTable.submitQuery(true, false);
    }) 
  }
  deleteAllocatedTrades (feesToProcessTable:AppallocationTableComponent,idtrade:number=undefined,allocatedqty:AbstractControl=undefined,orderTable:AppOrderTableComponent=undefined){
    let tradesToDelete=feesToProcessTable.selection.selected.filter(el=>!el.entries)
    if (tradesToDelete.length!==feesToProcessTable.selection.selected.length) {
      return this.CommonDialogsService.snackResultHandler({name:'error',detail:'Trades with entries have been selected. Accounted trades can not be deleted'},'Allocated trades delete',null,false);
    }
    if (!feesToProcessTable.selection.selected.length) {
      return this.CommonDialogsService.snackResultHandler({name:'error',detail:'No trades are selected to be deleted'},'DeleteAllocation')
    }
    this.CommonDialogsService.confirmDialog('Delete allocated trades ').pipe(
      filter (isConfirmed => isConfirmed.isConfirmed),
      // switchMap(data => this.TradeService.deleteAllocatedTrades(feesToProcessTable.selection.selected.map(el=>Number(el.id))))
    ).subscribe (deletedTrades=>{
      feesToProcessTable.selection.clear();
      // this.CommonDialogsService.snackResultHandler({name:'success',detail:deletedTrades.length+' have been deleted'},'Delete allocated trades: ',undefined,false)
      
    })
  }
}
