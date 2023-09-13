import { Injectable } from '@angular/core';
import { HadlingCommonDialogsService } from './hadling-common-dialogs.service';
import { AppTradeService } from './trades-service.service';
import { AppAccountingService } from './accounting.service';
import { AppallocationTableComponent } from '../components/tables/allocation-table.component/allocation-table.component';
import { filter, switchMap } from 'rxjs';
import { AbstractControl } from '@angular/forms';
import { AppOrderTableComponent } from '../components/tables/orders-table.component/orders-table.component';

@Injectable({
  providedIn: 'root'
})
export class AppAllocationService {

  constructor(
    private CommonDialogsService:HadlingCommonDialogsService,
    private TradeService: AppTradeService,
    private AccountingDataService:AppAccountingService, 
  ) { }
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
      this.CommonDialogsService.snackResultHandler({name:'success',detail:deletedTrades.length + ' entries have been deleted'},'Delete accounting: ',undefined,false)
      allocationTable.submitQuery(true, false);
    }) 
  }
  deleteAllocatedTrades (allocationTable:AppallocationTableComponent,idtrade:number,allocatedqty:AbstractControl,orderTable:AppOrderTableComponent){
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
      allocatedqty.patchValue(
        Number(allocatedqty.value)-deletedTrades.map(el=>el.idtrade==idtrade? el.qty:null).reduce((acc, value) => acc + Number(value), 0)
        );
      this.TradeService.sendNewAllocatedQty({idtrade:idtrade,allocatedqty:allocatedqty.value})
      this.TradeService.sendDeletedAllocationTrades(deletedTrades)
      orderTable.submitQuery(true, false).then(()=>orderTable.filterForAllocation())
    })
  }
}
