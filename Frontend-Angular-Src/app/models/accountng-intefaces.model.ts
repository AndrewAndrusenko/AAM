export interface BalanceDataPerPortfoliosOnDate {
  balance_date: Date,
  current_balance: number,
  account_id: number,
  account_no:string,
  idportfolio: number,
  portfolioname:string,
  currency_code: number
}
export interface FifoTableData {
  portfolioname: string,
  out_date:Date,
  allocated_trade:number,
  idtrade:number,
  tr_type:string,
  rest_qty:number,
  qty:number,
  qty_out:number,
  price_in:number,
  price_out:number,
  closed:boolean,
  idportfolio:number,
  trade_date:Date,
  id:number,
  generated:Date,
  profit_loss:number,
  id_sell_trade:number,
  id_buy_trade:number,
  secid:string,
  position_type:string
}
export interface FifoPositions {
  trade_date: Date,
  idtrade :number,
  idportfolio :number ,
  portfolioname  :string,
  secid :string,
  fifo_rest :number,
  fifo_cost :number,
  price_in :number,
  qty :number,
  qty_out :number,
  ext_trade:number
}
export interface bcTransactionType_Ext {
  id:number,
  manual_edit_forbidden:boolean,
  xActTypeCode_Ext:string,
  description:string,
  code2:number
}
export interface accessTransactionTypes {
  id :number, 
  transaction_type_id :number,
  description:string, 
  xActTypeCode_Ext:number,
  role:string,
  code2 :number
}
export interface bAccounts {
  accountNo: string,  
  accountTypeExt: number,  
  Information: string,  
  clientId: number,  
  currencyCode: number,  
  secid:number,
  entityTypeCode: number, 
  accountId: number,
  idportfolio: number,
  dateOpening: Date
}
export interface bAccountsList extends bAccounts {
  d_clientname: string, 
  d_portfolioCode: string,
  d_accountType: string,
  d_accTypeDescription: string,
  d_entityTypeCode: string,
  d_entityTypeDescription: string,
  action:string
}
export interface bLedger {
  ledgerNoId: number,
  ledgerNo: string, 
  name: string, 
  accountTypeID: number,  
  accountId: number,
  currecyCode: number, 
  externalAccountNo: string, 
  clientID: number,  
  entityTypeCode: number, 
  ledgerNoCptyCode: string,  
  ledgerNoTrade: string
}
export interface bLedgerAccounts extends bLedger {
  d_Account_Type: string,
  d_Client: string,
  d_APTypeCodeAccount: string,
  action:string
}
export class bTransactionForm {
  t_id:number|number[]=null;
  t_ledgerNoId: number=null;
  t_dataTime:Date =null;
  t_XactTypeCode: number=null;
  t_XactTypeCode_Ext: number =null;
  t_accountId: number  =null;
  t_amountTransaction: number =null;
  t_entryDetails: string =null;
  t_extTransactionId: number=null;
  t_idtrade: number=null;
  t_ledgerID_Debit: number =null;
  t_dateTime:Date=null;
  t_ledgerID: number  =null;
  t_amount: number =null;
}
export interface bAccountTransaction {
  id:number|number[],
  ledgerNoId: number,
  dataTime:Date, 
  XactTypeCode: number,
  XactTypeCode_Ext: number, 
  accountId: number,  
  amountTransaction: number, 
  entryDetails: string, 
  extTransactionId: number,
  idtrade: number
}
export interface bLedgerTransaction {
  id:number|number[],
  ledgerID_Debit: number, 
  dateTime:Date,
  XactTypeCode_Ext: number, 
  ledgerID: number,  
  amount: number, 
  entryDetails: string, 
  extTransactionId: number,
  idtrade: number
}
export interface bAccountingTransactionAll {
  id?:number,ledgerNoId?: number, dataTime?:Date, XactTypeCode?: number, accountId?: number,  amountTransaction?: number, entryDetails?: string, 
  ledgerID_Debit?: number, dateTime?:Date,  XactTypeCode_Ext?: number, ledgerID?: number,  amount?: number,
  extTransactionId?: number,idtrade?: number
}
export interface bAccountsEntriesList {
  d_portfolioname: string;
  d_transactionType:string,
  t_id: number,
  t_entryDetails:string,
  t_ledgerNoId: number, 
  t_accountId: number, 
  t_extTransactionId : number, 
  t_idtrade: number,
  t_dataTime: Date, 
  t_amountTransaction: number, 
  t_XactTypeCode: number,  
  t_XactTypeCode_Ext: number, 
  d_Debit : string,  
  d_Credit : string,  
  d_ledgerNo: string, 
  d_accountNo: string,  
  d_xActTypeCode_ExtName : string, 
  d_entryDetails: string, 
  d_manual_edit_forbidden: boolean
}
export interface bBalanceData {
  accountId: number,
  openingBalance: number,
  totalCredit:number,
  totalDebit:number,
  closingBalance:number,
}  
export interface bLedgerBalanceData { false
  accountId: number,
  openingBalance: number,
  accountTransaction:	number, 
  CrSignAmount:number,	
  DbSignAmount:number,
  closingBalance:number,
}    
export interface bAccountingEntriesComplexSearch {
  dataRange : {
    dateRangeStart:Date,
    dateRangeEnd:Date
  },
  noAccountLedger : string [],
  amountRange :{
    min: number,
    max: number
  }
}
export interface bBalanceFullData {
  portfolioname: string,
  accountNo : string, 
  accountId : number, 
  accountType : string, 
  datePreviousBalance : Date, 
  dateBalance : Date, 
  openingBalance : number, 
  totalCredit : number, 
  totalDebit : number, 
  OutGoingBalance : number,
  checkClosing : number 
  currencycode: string,
  dateOpening: Date,
  secid:string,
  xacttypecode: number
} 
export interface SWIFTStatement950model {
  id:number,
  msgId: number,
  amountTransaction: number,
  typeTransaction: string, 
  valueDate: string,
  comment: string, 
  entryAllocatedId: number,
  refTransaction: string,
  entriesAmount: number
}
export interface SWIFTSGlobalListmodel {
  id: number, 
  msgId: number, 
  senderBIC: string, 
  DateMsg: string, 
  typeMsg: string,
  accountNo: string,
  ledgerNo:string
  ledgerNoId:number
}
export interface bcEnityType {
  entityType: number, 
  entityTypeCode: string, 
  name: string, 
}
export interface bcAccountType_Ext {
  accountType_Ext: number, 
  xActTypeCode: number, 
  description: string, 
  actCodeShort: string, 
  APTypeCode: string, 
}
