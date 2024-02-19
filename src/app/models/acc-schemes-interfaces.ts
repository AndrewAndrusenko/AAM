export interface bcParametersSchemeAccTrans {
  pRef : string,
  pAmount: number,
  pSenderBIC: string,
  pRefTransaction: string,
  pDate_T: Date,
  cxActTypeCode_Ext:number,
  cxActTypeCode: number,
  cLedgerType: string,
  pAccountId: number,
  dAccountNo: string,
  pLedgerNoId: number,
  dLedgerNo: string,
  pExtTransactionId:string,
  cSchemeGroupId:string,
  valueDate: string
}
export interface bcSchemeLedgerTransaction {
  XactTypeCode_Ext:number,
  id:number,
  XactTypeCode:number,
  amount:string,
  accountNo:string,
  entryDetails:string,
  cSchemeGroupId:string,
  cDate:string,
  cxActTypeCode_Ext:string,
  cxActTypeCode:string,
  cLedgerType:string,
  extTransactionId:string,
  ledgerID:string,
  idtrade:string,
  dateTime:string,
  ledgerID_Debit:string
  ledger_credit:string,
  ledger_debit:string,
  action:number
}
export interface bcSchemeAccountTransaction {
  XactTypeCode_Ext:number,
  id:number,
  XactTypeCode:number,
  amountTransaction:string,
  accountNo:string,
  entryDetails:string,
  cSchemeGroupId:string,
  cDate:string,
  cxActTypeCode_Ext:string,
  cxActTypeCode:string,
  cLedgerType:string,
  extTransactionId:string,
  ledgerNoId:string,
  idtrade:string,
  dataTime:string,
  accountId:string
}
export interface bcSchemesProcesses {
  id:number, 
  process_code :string,
  process_description :string,
  scheme_code:number
}
export interface bcSchemesParameters {
  id:number,
  process_code_id:number,
  param_code:string,
  param_descrption:string
}