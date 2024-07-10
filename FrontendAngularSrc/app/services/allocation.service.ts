import { Injectable } from '@angular/core';
import { HadlingCommonDialogsService } from './hadling-common-dialogs.service';
import { AppTradeService } from './trades-service.service';
import { AppAccountingService } from './accounting.service';
import { AppallocationTableComponent } from '../components/tables/allocation-table.component/allocation-table.component';
import { Observable, Subject,  catchError,  exhaustMap,  filter, forkJoin, map,  of, switchMap, tap } from 'rxjs';
import { AbstractControl } from '@angular/forms';
import { AppOrderTableComponent } from '../components/tables/orders-table.component/orders-table.component';
import { allocation, allocation_fifo, orders } from '../models/interfaces.model';
import { AccountingTradesService } from './accounting-trades.service';
import { bAccountTransaction, bAccounts, bLedgerTransaction } from '../models/accountng-intefaces.model';
import { bcEntryParameters } from '../models/acc-schemes-interfaces';
import { AppRestrictionsHandlingService } from './restrictions-handling.service';
import { restrictionVerificationAllocation } from '../models/restrictions-interfaces.model';
import { AppInvRestrictionVerifyAllocTableComponent } from '../components/tables/inv-restriction-verify-alloc-table.component/inv-restriction-verify-alloc-table.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

@Injectable({
  providedIn: 'root'
})
export class AppAllocationService {

  private tradeToConfirm:allocation[];
  private deletedAccounting$ = new Subject <allocation_fifo[]>
  private createdAccounting$ = new Subject <bAccountTransaction[]|bLedgerTransaction[]>
  dialogRestrcitionsViolations: MatDialogRef<AppInvRestrictionVerifyAllocTableComponent>;

  constructor(
    private CommonDialogsService:HadlingCommonDialogsService,
    private TradeService: AppTradeService,
    private AccountingDataService:AppAccountingService, 
    private accountingTradeService: AccountingTradesService,
    private RestrictionsHandlingService: AppRestrictionsHandlingService,
    private dialog: MatDialog
  ) { }
  executeOrdersSrv(
    qtyForAllocation: number, unexecutedTotal: number, ordersForExecution: number[], price: number, tidinstrument: string,idtrade:number,ordType:string
    ):Observable<orders[]> {
    return of(qtyForAllocation).pipe (
      tap(data=>data<1? this.CommonDialogsService.snackResultHandler({name:'error',detail:'The whole trade volume has been allocated!'},'Allocation'):null),
      filter(data=>data>0),
      tap(()=>!unexecutedTotal? this.CommonDialogsService.snackResultHandler({name:'error',detail:'Orders have been allocated!'},'Allocation'):null),
      filter(()=>unexecutedTotal>0),
      switchMap(()=>ordType==='BUY'? this.RestrictionsHandlingService.getVerificationForAllocation(
        price,
        tidinstrument,
        ordersForExecution,
        Number(qtyForAllocation)
        ):of([])),
      switchMap(data=>data.length? this.showViolations(data):of(true)),
      filter(allocApproved=>allocApproved===true),
      switchMap(()=>this.TradeService.executeOrders(ordersForExecution,Number(qtyForAllocation),idtrade))
      )
  }
  showViolations (data:restrictionVerificationAllocation[]):Observable <boolean> {
    this.dialogRestrcitionsViolations = this.dialog.open(AppInvRestrictionVerifyAllocTableComponent)
    this.dialogRestrcitionsViolations.componentInstance.dataVerification = data
    return this.dialogRestrcitionsViolations.afterClosed()
  }
  createAccountingForAllocation (allocationTable:AppallocationTableComponent) {
    this.tradeToConfirm = allocationTable.selection.selected;
    this.TradeService.getEntriesPerAllocatedTrade(this.tradeToConfirm.map(el=>Number(el.id))).pipe(
      tap(entriesData=>entriesData.length?  
        this.CommonDialogsService.snackResultHandler({name:'error',detail:'There are created entries for the trades: '+[...entriesData.map(el=>el.idtrade)]}) : null),
      filter(entriesData=>entriesData.length===0),
      map(()=>new Set(this.tradeToConfirm.filter(trade=>!trade.depoAccountId).map(el=>el.secid))),
      switchMap((secidWithoutDepo)=>secidWithoutDepo.size>0? this.createNewDepoAccounts(secidWithoutDepo):of(secidWithoutDepo)),
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
      let bcEntryParameters: bcEntryParameters = {
        id_settlement_currency:clientTrade.id_settlement_currency,
        cptyCode:clientTrade.cpty_code,
        pDate_T:new Date(clientTrade.tdate).toDateString(),
        pAccountId:clientTrade.accountId,
        pDepoAccountId:clientTrade.depoAccountId,
        pQty:clientTrade.qty,
        pSettlementAmount:clientTrade.trade_amount,
        secid:clientTrade.secid,
        allocated_trade_id:clientTrade.id,
        idtrade:clientTrade.idtrade,
      }
      let cSchemeGroupId = clientTrade.trtype==='BUY'? 'Investment_Buy_Basic':'Investment_Sell_Basic';
      let accountingToCreate$ : Observable <bAccountTransaction[]|bLedgerTransaction[]>[];
      accountingToCreate$ =[];
      this.accountingTradeService.createFIFOtransactions(clientTrade.trtype==='BUY'? -1 : 1,null,clientTrade.idportfolio,clientTrade.secid,clientTrade.qty,clientTrade.trade_amount/clientTrade.qty, clientTrade.id).pipe (
        tap(data=>data['name']==='error'? this.CommonDialogsService.snackResultHandler(data):createdAccountingTransactions.push(data)),
        filter(data=>data['name']!=='error'),
        
        switchMap(()=> 
          forkJoin([
            this.AccountingDataService.getAccountingScheme(bcEntryParameters,cSchemeGroupId).pipe(
              map(entryDrafts=>entryDrafts.forEach(draft=>
                accountingToCreate$.push(
                  this.AccountingDataService.updateEntryAccountAccounting (draft,'Create').pipe(
                    catchError((err) => {
                      console.log('err updateEntryAccountAccounting',);
                      this.CommonDialogsService.snackResultHandler(err.error)
                      return of(err);
                    })
                  )
                )
              ))
            ) ,
            this.AccountingDataService.getAccountingScheme(bcEntryParameters,cSchemeGroupId,'LL').pipe(
              map(entryDrafts=>entryDrafts.forEach(draft=>{
                accountingToCreate$.push(
                  this.AccountingDataService.updateLLEntryAccountAccounting (draft,'Create').pipe(
                    catchError((err) => {
                      console.log('err updateLLEntryAccountAccounting',);
                      this.CommonDialogsService.snackResultHandler(err.error)
                      return of(err);
                    })
                  )
                )
              }))
            )
          ])
        ),
        switchMap(()=>forkJoin(accountingToCreate$))
      ).subscribe( (data)=> {
        let err = data.filter(el=>el['error'])
        if (err.length) { 
          this.accountingTradeService.deleteAccountingAndFIFOtransactions (this.tradeToConfirm.map(el=>Number(el.id))).subscribe(d=>{
            console.log('rollback:',d)
          })
        } else { 
          createdAccountingTransactions.push(data)
          let index = tradeToConfirmProcessStatus.findIndex(el=>el.id===clientTrade.id);
          index!==-1? tradeToConfirmProcessStatus[index].accounting=0 : null;
          this.createAllocationAccountingStatus(allocationTable,tradeToConfirmProcessStatus,createdAccountingTransactions)
        }
      })
    })
  }
  createNewDepoAccounts (secidSet:Set<string>):Observable<{secid?:bAccounts[]}> {
    let createDepoAccountSt:{secid?:Observable<bAccounts[]>}={}
    secidSet.forEach(secidItem=>{
      let portfoliosIDsToOpenDepo = this.tradeToConfirm.filter(trade=>trade.secid===secidItem&&!trade.depoAccountId).map(trade=>Number(trade.idportfolio));
      Object.assign(createDepoAccountSt,{
        [secidItem]: this.AccountingDataService.createDepoSubAccounts(portfoliosIDsToOpenDepo,secidItem).pipe (
          tap(newDepoAccounts=>newDepoAccounts?.['name']? this.CommonDialogsService.snackResultHandler(newDepoAccounts):null)
        )}
      )
    })
    return forkJoin(createDepoAccountSt).pipe(
      tap(newAccounts=>
        Object.entries(newAccounts).forEach(depoAccounts=>{
          depoAccounts[1].forEach(account=>{
            let i = this.tradeToConfirm.findIndex(el=>el.idportfolio==account.idportfolio&&el.secid===depoAccounts[0])
            i!==-1? this.tradeToConfirm[i].depoAccountId=account.accountId:null;
          })
        }))
      )
  }
  createAllocationAccountingStatus (allocationTable:AppallocationTableComponent,tradeToConfirmProcessStatus:{id:number,accounting:number}[],createdAccountingTransactions: bAccountTransaction[]|bLedgerTransaction[]) {
    let status = tradeToConfirmProcessStatus.reduce((acc,val)=>acc+val.accounting,0)
    if (status===0) {
      allocationTable.submitQuery(true,false);
      this.sendCreatedAccounting(createdAccountingTransactions);
      this.CommonDialogsService.snackResultHandler({name:'success',detail:'Accounting has been created'},'Allocation Accounting',undefined,false);
    }
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
      switchMap(() => this.accountingTradeService.deleteAccountingAndFIFOtransactions (tradesToDelete))  
    ).subscribe (deletedTrades=>{
      this.sendDeletedAccounting(deletedTrades);
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
  getDeletedAccounting ():Observable<allocation_fifo[]>   {
    return this.deletedAccounting$.asObservable()
  }
  sendDeletedAccounting (deletedTransactions:allocation_fifo[]) {
    this.deletedAccounting$.next(deletedTransactions);
  }
  getCreatedAccounting ():Observable<bAccountTransaction[]|bLedgerTransaction[]>   {
    return this.createdAccounting$.asObservable()
  }
  sendCreatedAccounting (createdTransactions:bAccountTransaction[]|bLedgerTransaction[]) {
    this.createdAccounting$.next(createdTransactions);
  }
}
