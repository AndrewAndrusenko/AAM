import { Injectable } from '@angular/core';
import { HadlingCommonDialogsService } from './hadling-common-dialogs.service';
import { AppTradeService } from './trades-service.service';
import { AppAccountingService } from './accounting.service';
import { AppallocationTableComponent } from '../components/tables/allocation-table.component/allocation-table.component';
import { Observable, filter, forkJoin, map,  switchMap, tap } from 'rxjs';
import { AbstractControl } from '@angular/forms';
import { AppOrderTableComponent } from '../components/tables/orders-table.component/orders-table.component';
import { ManagementFeeCalcData, allocation } from '../models/intefaces.model';
import { AccountingTradesService } from './accounting-trades.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AppFeesHandlingService {
  private tradeToConfirm:allocation[];
  constructor(
    private http :HttpClient,
    private CommonDialogsService:HadlingCommonDialogsService,
    private TradeService: AppTradeService,
    private AccountingDataService:AppAccountingService, 
    private accountingTradeService: AccountingTradesService,
  ) { }
  getManagementFeeCalcData (searchObj : {action:string,p_report_date_start:string,p_report_date_end:string, p_portfolios_list: string []})
  :Observable<ManagementFeeCalcData[]> {
    searchObj.action='getManagementFeesCalcData';
    return this.http.get <ManagementFeeCalcData[]> ('/api/AAM/getFeesData/',{params:searchObj})
  }
  createAccountingForManagementFees (allocationTable:AppallocationTableComponent) {
    this.tradeToConfirm = allocationTable.selection.selected;
    this.TradeService.getEntriesPerAllocatedTrade(this.tradeToConfirm.map(el=>Number(el.id))).pipe(
      tap(entriesData=>entriesData.length?  
        this.CommonDialogsService.snackResultHandler({name:'error',detail:'There are created entries for the trades: '+[...entriesData.map(el=>el.idtrade)]}) : null),
      filter(entriesData=>entriesData.length===0),
      tap(()=>console.log('portfolioWitoutAccounts', this.tradeToConfirm.filter(trade=>!trade.accountId||!trade.depoAccountId).map(trade=>{return trade.portfolioname}))),
      tap(()=>{
        let portfolioWitoutAccounts = this.tradeToConfirm.filter(trade=>!trade.accountId||!trade.depoAccountId)
        console.log('portfolioWitoutAccounts',portfolioWitoutAccounts);
        portfolioWitoutAccounts.length? this.CommonDialogsService.snackResultHandler({name:'error',detail:'There are no opened current or depo accounts for the portfolios: '+[...portfolioWitoutAccounts.map(trade=>trade.portfolioname)]}) : null;
      }),
      filter(()=>this.tradeToConfirm.filter(trade=>!trade.accountId||!trade.depoAccountId).length===0),
    ).subscribe(()=>this.entriesCreationForAllocation(allocationTable))
    allocationTable.selection.clear();
  }
  entriesCreationForAllocation (allocationTable:AppallocationTableComponent) {
    let createdAccountingTransactions = [];
    let tradeToConfirmProcessStatus = this.tradeToConfirm.map(el=>{return {id:el.id,accounting:1}})
    this.tradeToConfirm.forEach(clientTrade => {
      let bcEntryParameters = <any> {}
      bcEntryParameters.id_settlement_currency=clientTrade.id_settlement_currency;
      bcEntryParameters.cptyCode='CHASUS';
      bcEntryParameters.pDate_T=new Date(clientTrade.tdate).toDateString();
      bcEntryParameters.pAccountId=clientTrade.accountId;
      bcEntryParameters.pDepoAccountId=clientTrade.depoAccountId;
      bcEntryParameters.pQty=clientTrade.qty;
      bcEntryParameters.pSettlementAmount=clientTrade.trade_amount;
      bcEntryParameters.secid=clientTrade.secid;
      bcEntryParameters.allocated_trade_id=clientTrade.id;
      bcEntryParameters.idtrade=clientTrade.idtrade;
      let cSchemeGroupId = clientTrade.trtype==='BUY'? 'Investment_Buy_Basic':'Investment_Sell_Basic';
      let accountingToCreate$= <any>[]
      this.AccountingDataService.createFIFOtransactions(clientTrade.trtype==='BUY'? -1 : 1,null,clientTrade.idportfolio,clientTrade.secid,clientTrade.qty,clientTrade.trade_amount/clientTrade.qty, clientTrade.id).pipe (
        tap(data=>data['name']==='error'? this.CommonDialogsService.snackResultHandler(data):createdAccountingTransactions.push(data)),
        filter(data=>data['name']!=='error'),
        switchMap(()=> 
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
          ])
        ),
        switchMap(()=>forkJoin(accountingToCreate$))
      ).subscribe(data=>{
        createdAccountingTransactions.push(data)
        let index = tradeToConfirmProcessStatus.findIndex(el=>el.id===clientTrade.id);
        index!==-1? tradeToConfirmProcessStatus[index].accounting=0 : null;
      })
    })
  }

  deleteAccountingForAllocatedTrades (allocationTable:AppallocationTableComponent){
    let tradesToDelete = allocationTable.selection.selected.map(trade=>Number(trade.id))
    if (!tradesToDelete.length) {
      return this.CommonDialogsService.snackResultHandler({name:'error',detail:'No trades are selected to be deleted'},'Delete Allocation Accounting')
    }
    this.AccountingDataService.GetbParamsgfirstOpenedDate('GetbParamsgfirstOpenedDate').pipe(
      tap (data =>{
        if (allocationTable.selection.selected.filter(el=>el.tdate<data[0].FirstOpenedDate).length) {
          return this.CommonDialogsService.snackResultHandler({name:'error',detail:'Trades with entries in closed period have been selected. Entires in closed period can not been deleted'},'Delete Allocation Accounting',undefined,false);
        }
      }),
      filter(data=>allocationTable.selection.selected.filter(el=>el.tdate<data[0].FirstOpenedDate).length===0),
      switchMap(()=>this.CommonDialogsService.confirmDialog('Delete accouting for allocated trades ')),
      filter (isConfirmed => isConfirmed.isConfirmed),
      switchMap(() => this.AccountingDataService.deleteAccountingAndFIFOtransactions (tradesToDelete))  
    ).subscribe (deletedTrades=>{
      allocationTable.selection.clear();
      let result = deletedTrades['name']==='error'? deletedTrades : {name:'success',detail:'Accounting and FIFO have been deleted'};
      this.CommonDialogsService.snackResultHandler(result,'Delete accounting: ',undefined,false)
      allocationTable.submitQuery(true, false);
    }) 
  }
  deleteAllocatedTrades (allocationTable:AppallocationTableComponent,idtrade:number=undefined,allocatedqty:AbstractControl=undefined,orderTable:AppOrderTableComponent=undefined){
    let tradesToDelete=allocationTable.selection.selected.filter(el=>!el.entries)
    if (tradesToDelete.length!==allocationTable.selection.selected.length) {
      return this.CommonDialogsService.snackResultHandler({name:'error',detail:'Trades with entries have been selected. Accounted trades can not be deleted'},'Allocated trades delete',null,false);
    }
    if (!allocationTable.selection.selected.length) {
      return this.CommonDialogsService.snackResultHandler({name:'error',detail:'No trades are selected to be deleted'},'DeleteAllocation')
    }
    this.CommonDialogsService.confirmDialog('Delete allocated trades ').pipe(
      filter (isConfirmed => isConfirmed.isConfirmed),
      switchMap(data => this.TradeService.deleteAllocatedTrades(allocationTable.selection.selected.map(el=>Number(el.id))))
    ).subscribe (deletedTrades=>{
      allocationTable.selection.clear();
      this.CommonDialogsService.snackResultHandler({name:'success',detail:deletedTrades.length+' have been deleted'},'Delete allocated trades: ',undefined,false)
      if (allocatedqty!==undefined) {
        allocatedqty.patchValue(
          Number(allocatedqty.value)-deletedTrades.map(el=>el.idtrade==idtrade? el.qty:null).reduce((acc, value) => acc + Number(value), 0)
          );
        this.TradeService.sendNewAllocatedQty({idtrade:idtrade,allocatedqty:allocatedqty.value})
      }
      this.TradeService.sendDeletedAllocationTrades(deletedTrades)
      orderTable!==undefined? orderTable.submitQuery(true, false): null;
    })
  }
}
