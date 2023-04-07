import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { lastValueFrom, Observable } from 'rxjs';
import { bcParametersSchemeAccTrans } from '../models/accounts-table-model';
import { AppAccountingService } from './app-accounting.service';

@Injectable({
  providedIn: 'root'
})
export class HandlingEntryProcessingService {
  constructor(
    private AccountingDataService:AppAccountingService, 
    public snack:MatSnackBar

  ) { }
  async openEntry (row: any, parentMsgRow:any ) {
    if (Number(row.entriesAmount) > Number(row.amountTransaction) && ['CR','DR'].includes(row.typeTransaction)) {
      let EmptyEntry = {'entryDraft' : {}, 'formStateisDisabled': true}
      this.AccountingDataService.sendEntryDraft(EmptyEntry);
    } else {
      let accountNo = row.comment.split('/')[3];
      await lastValueFrom (this.AccountingDataService.GetAccountData(0,0,0, accountNo,'GetAccountData'))
      .then ((accountData) => {
        if (accountData.length) {
          let bcEntryParameters = <bcParametersSchemeAccTrans> {}
          bcEntryParameters.pAccountId = Number(accountData[0].accountId);
          bcEntryParameters.pLedgerNoId = parentMsgRow.ledgerNoId;
          bcEntryParameters.pExtTransactionId = row.id;
          bcEntryParameters.pAmount = row.amountTransaction;
          bcEntryParameters.pDate_T = row.valueDate ;
          bcEntryParameters.pSenderBIC = parentMsgRow.senderBIC;
          bcEntryParameters.pRef = row.refTransaction;
          bcEntryParameters.cxActTypeCode = row.typeTransaction;
          bcEntryParameters.cxActTypeCode_Ext = row.comment.split('/')[1];
          bcEntryParameters.cLedgerType = 'NostroAccount';
          this.AccountingDataService.GetEntryScheme (bcEntryParameters).subscribe (entryScheme => {
            this.AccountingDataService.sendEntryDraft({'entryDraft' : entryScheme, 'formStateisDisabled': false, 'refTransaction': row.refTransaction, 'autoProcessing':true});
          });
        } else {
          this.snack.open('Error: Account No: ' +accountNo +' has not been found for ref:'+row.refTransaction,'OK',{panelClass: ['snackbar-error']}); 
        }
      })
    }
  }
}
