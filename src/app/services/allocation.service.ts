import { Injectable } from '@angular/core';
import { HadlingCommonDialogsService } from './hadling-common-dialogs.service';
import { AppTradeService } from './trades-service.service';
import { AppAccountingService } from './accounting.service';
import { AppallocationTableComponent } from '../components/tables/allocation-table.component/allocation-table.component';
import { filter, firstValueFrom, map, switchMap } from 'rxjs';
import { AbstractControl } from '@angular/forms';
import { AppOrderTableComponent } from '../components/tables/orders-table.component/orders-table.component';
import { allocation, bAccountTransaction, bLedgerTransaction } from '../models/intefaces.model';
import { AccountingTradesService } from './accounting-trades.service';

@Injectable({
  providedIn: 'root'
})
export class AppAllocationService {
  private tradeToConfirm:allocation[]
  constructor(
    private CommonDialogsService:HadlingCommonDialogsService,
    private TradeService: AppTradeService,
    private AccountingDataService:AppAccountingService, 
    private accountingTradeService: AccountingTradesService,
  ) { }
  async createAccountingForAllocation (allocationTable:AppallocationTableComponent) {
    this.tradeToConfirm = allocationTable.selection.selected;
    let tradeToConfirmProcessStatus = this.tradeToConfirm.map(el=>{return {id:el.id,bAccountTransaction:1,bLedgerTransaction:1}})
    let portfolioWitoutAccounts = allocationTable.selection.selected.filter(trade=>!trade.accountId||!trade.depoAccountId).map(trade=>{return trade.portfolioname});

    let tradesWithAccounting = allocationTable.selection.selected.filter(trade=>trade.entries>0).map(trade=>{return trade.id});
    if (tradesWithAccounting.length) {
      this.CommonDialogsService.snackResultHandler({name:'error',detail:'There are created entries for the trades: '+[...tradesWithAccounting]});
      return;
    }
    let secidSet = new Set(this.tradeToConfirm.filter(trade=>!trade.depoAccountId).map(el=>el.secid));
    console.log('secidSet',secidSet);
    if (secidSet.size) {
      await this.createNewDepoAccounts(secidSet).then(tradeWithDepo=>tradeWithDepo);
    }
    portfolioWitoutAccounts = allocationTable.selection.selected.filter(trade=>!trade.accountId||!trade.depoAccountId).map(trade=>{return trade.portfolioname});
/*     if (depoSubAccountsToOpen.length) {
      console.log('depo',depoSubAccountsToOpen);
      await firstValueFrom (this.AccountingDataService.createDepoSubAccounts(depoSubAccountsToOpen,this.tidinstrument.value)).then(newDepoAccounts=>{
        console.log('d',newDepoAccounts);
        newDepoAccounts.forEach (depoAccount=>{ 
          let i =this.tradeToConfirm.findIndex(el=>el.idportfolio==depoAccount.idportfolio);
          i!==-1? this.tradeToConfirm[i].depoAccountId=depoAccount.accountId:null;
        })
      })
    } */
    if (portfolioWitoutAccounts.length) {
      this.CommonDialogsService.snackResultHandler({name:'error',detail:'There are no opened current or depo accounts for the portfolios: '+[...portfolioWitoutAccounts]});
      return;
    }
    let bcEntryParameters = <any> {}
    let createdEntries = <bAccountTransaction[]>[]
    let createdLLEntries = <bLedgerTransaction[]>[]
    this.tradeToConfirm.forEach(clientTrade => {
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
    this.accountingTradeService.getAccountingScheme(bcEntryParameters,'Investment_Buy_Basic').pipe(
      map(entryDrafts=>entryDrafts.forEach(draft=>this.AccountingDataService.updateEntryAccountAccounting (draft,'Create',).subscribe(el=>createdEntries.push(...el))))
    ).subscribe (result => {
      let index = tradeToConfirmProcessStatus.findIndex(el=>el.id===clientTrade.id);
      index!==-1? tradeToConfirmProcessStatus[index].bAccountTransaction=0 : null;
      this.createAllocationAccountingStatus(allocationTable,tradeToConfirmProcessStatus,'AL');
    })
    this.accountingTradeService.getAccountingScheme(bcEntryParameters,'Investment_Buy_Basic','LL').pipe(
      map(entryDrafts=>entryDrafts.forEach(draft=>this.AccountingDataService.updateLLEntryAccountAccounting (draft,'Create',).subscribe(el=>createdLLEntries.push(...el))))
    ).subscribe (result => {
      let index = tradeToConfirmProcessStatus.findIndex(el=>el.id===clientTrade.id);
      index!==-1? tradeToConfirmProcessStatus[index].bLedgerTransaction=0 : null;

      this.createAllocationAccountingStatus(allocationTable,tradeToConfirmProcessStatus,'LL')
    })
    })
    allocationTable.selection.clear();
  }
  async createNewDepoAccounts (secidSet:Set<string>,) {
    return new Promise <true>  ((resolve, resject) =>{
      let index = 0
      secidSet.forEach(async secidItem=>{
        let portfoliosIDsToOpenDepo = this.tradeToConfirm.filter(trade=>trade.secid===secidItem).map(trade=>Number(trade.idportfolio));
        await firstValueFrom (this.AccountingDataService.createDepoSubAccounts(portfoliosIDsToOpenDepo,secidItem)).then(newDepoAccounts=>{
          console.log('d',newDepoAccounts);
          newDepoAccounts.forEach (depoAccount=>{ 
            let i =this.tradeToConfirm.findIndex(el=>el.idportfolio==depoAccount.idportfolio&&el.secid===secidItem);
            i!==-1? this.tradeToConfirm[i].depoAccountId=depoAccount.accountId:null;
            console.log('newDepoAccounts i',i,this.tradeToConfirm[i].depoAccountId);
          });
          index +=1;
          console.log('size',secidSet.size,index);
          console.log('tradeToConfirm',...this.tradeToConfirm);
          secidSet.size===index? resolve(true):null
        });
      });
    }); 
  }
  createAllocationAccountingStatus (allocationTable:AppallocationTableComponent,tradeToConfirmProcessStatus:{id:number,bAccountTransaction:number,bLedgerTransaction:number}[],type:string) {
    let status = tradeToConfirmProcessStatus.reduce((acc,val)=>acc+val.bAccountTransaction+val.bLedgerTransaction,0)
    status===0? allocationTable.submitQuery(true,false).then(data=>{
      this.CommonDialogsService.snackResultHandler({name:'success',detail:'Accounting has been created'},'Allocation Accounting',undefined,false)
    }):null;
  }
  deleteAccountingForAllocatedTrades (allocationTable:AppallocationTableComponent) {
    let tradesToDelete = allocationTable.selection.selected.map(trade=>Number(trade.id))
    if (!tradesToDelete.length) {
      return this.CommonDialogsService.snackResultHandler({name:'error',detail:'No trades are selected to be deleted'},'Delete Allocation Accounting')
    }
    if (allocationTable.selection.selected.filter(el=>el.tdate<allocationTable.FirstOpenedAccountingDate).length) {
      return this.CommonDialogsService.snackResultHandler({name:'error',detail:'Trades with entries in closed period have been selected. Entires in closed period can not been deleted'},'Delete Allocation Accounting',undefined,false);
    }
    this.CommonDialogsService.confirmDialog('Delete accouting for allocated trades ').pipe(
      filter (isConfirmed => isConfirmed.isConfirmed),
      switchMap(data => this.AccountingDataService.deleteAllocationAccounting (tradesToDelete))
    ).subscribe (deletedTrades=>{
      allocationTable.selection.clear();
      let result = deletedTrades['name']==='error'? deletedTrades : {name:'success',detail:deletedTrades.length + ' entries have been deleted'};
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
      orderTable!==undefined? orderTable.submitQuery(true, false).then(()=>orderTable.filterForAllocation()): null;
    })
  }
}
