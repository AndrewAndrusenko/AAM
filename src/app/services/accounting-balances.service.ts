import { Injectable } from "@angular/core";
import { AppAccountingService } from "./accounting.service";
import { HadlingCommonDialogsService } from "./hadling-common-dialogs.service";
import { Observable, Subject, filter, forkJoin, map, of, pluck, switchMap, tap } from "rxjs";
import { bBalanceFullData } from "../models/accountng-intefaces.model";
export interface checkBalanceData {
  totalPassive:number,
  totalActive:number,
  totalDebit:number,
  balanceData:bBalanceFullData[],
  entriesTotal:number
}
@Injectable ({
  providedIn:'root'
})
export class AccountingBalncesService {
  private subjectBalanceData = new Subject<bBalanceFullData[]> 
  constructor (
    private AccountingDataService:AppAccountingService,
    private CommonDialogsService:HadlingCommonDialogsService,
    ){ }
  accountingBalanceClose (overdraftOverride:boolean, firstClosingDate:string):Observable<{message:string, state:string}> {
    let executionLog:{message:string, state:string} = {message:null,state:'pending'}
    return this.AccountingDataService.GetbAccountingDateToClose('GetbAccountingDateToClose').pipe(
      map(data=>new Date(data[0].accountingDateToClose).toLocaleDateString()),
      tap(dateToClose=>{
        dateToClose!==firstClosingDate? this.CommonDialogsService.snackResultHandler({name:'error',detail:'Entries dated '+dateToClose+' have been generated. Please reload the page!'}):null
      }),
      filter(dateToClose=>(dateToClose===firstClosingDate)),
      switchMap(()=>this.AccountingDataService.GetALLClosedBalances({dateRangeStart:firstClosingDate,dateRangeEnd:firstClosingDate},null,new Date(firstClosingDate).toDateString(), null, 'GetALLClosedBalances')),
      map(data=>data.filter(el=>el.OutGoingBalance<0)),
      tap(data=>{
        if (data.length>0) {
          this.sendbBalanceData(data);
          overdraftOverride===false? executionLog={message:'Closing with overdrafts is forbidden',state:'error'}:null;
        }
      }),
      switchMap(data=> data.length>0&&overdraftOverride? this.CommonDialogsService.confirmDialog('Close balance with overdrafts accounts') : of({isConfirmed:null})),
      tap(confirm=>confirm.isConfirmed===false? executionLog={
        message:'Closing has been canceled',
        state:'error',}:null),
      switchMap(()=>executionLog.state==='pending'? this.AccountingDataService.accountingBalanceCloseInsert ({closingDate : firstClosingDate}):of(executionLog)),
    )
  } 
  sendbBalanceData (data:bBalanceFullData[]) {this.subjectBalanceData.next(data)}
  receivebBalanceData ():Observable<bBalanceFullData[]> {return this.subjectBalanceData.asObservable()}
  checkBalance (dateBalance: string,firstClosingDate:string):Observable<checkBalanceData> {
    return forkJoin({
      totalPassive:of(0),
      totalActive:of(0),
      totalDebit:of(0),
      balanceData:this.AccountingDataService.GetALLClosedBalances({dateRangeStart:dateBalance,dateRangeEnd:dateBalance},null,firstClosingDate, null, 'GetALLClosedBalances'),
      entriesTotal: this.AccountingDataService.GetbAccountingSumTransactionPerDate(dateBalance,'SumTransactionPerDate').pipe(map(data=>data[0].amountTransaction))})
      .pipe(
        map(data=>{
          data.balanceData.forEach(el => {
            data.totalDebit += Number(el.totalDebit);
            Number(el.xacttypecode) == 1 ? data.totalPassive = data.totalPassive + Number(el.OutGoingBalance): data.totalActive =data.totalActive + Number(+el.OutGoingBalance);
          });
          data.totalActive = Math.round(data.totalActive*100)/100;
          data.totalPassive = Math.round(data.totalPassive*100)/100;
          data.totalDebit = Math.round(data.totalDebit*100)/100;
          return data;
      })
     )
  }
  
}