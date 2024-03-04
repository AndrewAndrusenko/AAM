import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { lastValueFrom } from 'rxjs';
import { AppAccountingService } from './accounting.service';
import { bcEntryParameters } from '../models/acc-schemes-interfaces';
import { SWIFTSGlobalListmodel, SWIFTStatement950model } from '../models/accountng-intefaces.model';

@Injectable({
  providedIn: 'root'
})
export class HandlingEntryProcessingService {
  constructor(
    private AccountingDataService:AppAccountingService, 
    public snack:MatSnackBar

  ) { }
  async openEntry (row: SWIFTStatement950model, parentMsgRow:SWIFTSGlobalListmodel, autoProcessing?: boolean, dateToProcess?: Date, overRideOverdraft?:boolean ) {
    if (Number(row.entriesAmount) > Number(row.amountTransaction) && ['CR','DR'].includes(row.typeTransaction)) {
      let EmptyEntry = {'entryDraft' : null, 'formStateisDisabled': true, 'overRideOverdraft' :overRideOverdraft}
      this.AccountingDataService.sendEntryDraft(EmptyEntry);

    } else {
      let accountNo = row.comment.split('/')[3];
      await lastValueFrom (this.AccountingDataService.GetAccountData(0,0,0, accountNo,'GetAccountData','accountData'))
      .then ((accountData) => {
        if (accountData.length) {
          let bcEntryParameters = <bcEntryParameters> {}
          bcEntryParameters.pAccountId = Number(accountData[0].accountId);
          bcEntryParameters.pLedgerNoId = parentMsgRow.ledgerNoId;
          bcEntryParameters.pExtTransactionId = row.id;
          bcEntryParameters.pAmount = row.amountTransaction;
          bcEntryParameters.pDate_T = dateToProcess? new Date (dateToProcess).toDateString() : row.valueDate ;
          bcEntryParameters.valueDate = row.valueDate ;
          bcEntryParameters.pSenderBIC = parentMsgRow.senderBIC;
          bcEntryParameters.pRef = row.refTransaction;
          bcEntryParameters.cSchemeGroupId = row.comment.split('/')[1]+'_'+row.typeTransaction+'_NOSTRO';
          this.AccountingDataService.getAccountingScheme (bcEntryParameters, bcEntryParameters.cSchemeGroupId ).subscribe (entryScheme => {
            this.AccountingDataService.sendEntryDraft({'entryDraft' : entryScheme[0], 'formStateisDisabled': false, 'refTransaction': row.refTransaction, 'autoProcessing':autoProcessing, 'overRideOverdraft' :overRideOverdraft});
          });
        } else {
          this.snack.open('Error: Account No: ' +accountNo +' has not been found for ref:'+row.refTransaction,'OK',{panelClass: ['snackbar-error']}); 
        }
      })
    }
  }
}
