import { number } from "echarts";
import { DBConfig } from "ngx-indexed-db";
/* export const indexDbConfigAAM: DBConfig  = {
  name: 'AAMdb',
  version: 1,
  objectStoresMeta: [{
    store: 'instrumentCorpActions',
    storeConfig: { keyPath: 'id', autoIncrement: true },
    storeSchema: [
      { name: 'id', keypath: 'name', options: { unique: false } },
      { name: 'isin', keypath: 'email', options: { unique: false } },
      { name: 'secname', keypath: 'email', options: { unique: false } },
      { name: 'notinal', keypath: 'email', options: { unique: false } },
      { name: 'notinalcurrency', keypath: 'email', options: { unique: false } },
      { name: 'unredemeedvalue', keypath: 'email', options: { unique: false } },
      { name: 'couponrate', keypath: 'email', options: { unique: false } },
      { name: 'couponamount', keypath: 'email', options: { unique: false } },
      { name: 'actiontype', keypath: 'email', options: { unique: false } },
      { name: 'date', keypath: 'email', options: { unique: false } },accessRestriction
      { name: 'action':string, keypath: 'email', options: { unique: false } }
    ]
  }]
};  */

export const indexDbConfigAAM: DBConfig  = {
  name: 'AAMdb',
  version: 1,
  objectStoresMeta: [{
    store: 'AAMCache',
    storeConfig: { keyPath: 'code', autoIncrement: false },
    storeSchema: [
      { name: 'code', keypath: 'code', options: { unique: false } },
      { name: 'data', keypath: 'data', options: { unique: false } },
     
    ]
  }]
}; 
export const portfolioTypes :portfolioType [] = [
  {value: 1, viewValue: 'Model Portfolio'},
  {value: 2, viewValue: 'Strategy (based on MP)'},
]
export interface AccountsTableModel {
 idportfolio:number;
 idclient:number;
 idstategy:number;
 sname:string;
 portfolioname:string;
 portleverage:number; 
}
export interface accessRestriction {
id:string, 
accessrole:string, 
elementid:string, 
tsmodule:string, 
htmltemplate:string, 
elementtype:string, 
elementvalue:string
}
export interface InstrumentData {
  secid :string, 
  shortname :string, 
  name :string,  
  isin :string,  
  listlevel :number, 
  facevalue :number, 
  faceunit :string,
  primary_board_title :string,
  s_qualified_investors :number,
  registryclosedate :string,  
  lotsize :number, 
  price :number, 
  discountl0 :number, 
  discounth0 :number,
  fullcovered :string
}

export interface ClientData {
  idclient: number,
  clientname: string,
  idcountrydomicile: number,
  isclientproffesional: boolean,
  address: string,
  contact_person:string,
  email: string,
  phone: string,
  code : string,
}
interface portfolioType {
  value: number;
  viewValue: string;
}

export interface StrategiesGlobalData {
  id: number, 
  name : string, 
  stype : number,
  Level : number,
  description: string, 
  s_benchmark_account: number,
  'Benchmark Account': string, 
}
export interface StrategyStructure {
  id_strategy_parent: number, 
  id : number, 
  sname : string,
  description: string;
  weight_of_child : number,
  id_item:number,
}
export interface accountTypes {
  typeCode: string, 
  typeValue: string,
  typeDescription: string
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
export interface bcTransactionType_Ext {
  id: number, 
  xActTypeCode_Ext: string, 
  description: string, 
  code2: string,
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

export interface bcParametersSchemeAccTrans {
  pRef : string,
  pAmount: number,
  pSenderBIC: string,
  pRefTransaction: string,
  pDate_T: string,
  cxActTypeCode_Ext:number,
  cxActTypeCode: number,
  cLedgerType: string,
  pAccountId: number,
  dAccountNo: string,
  pLedgerNoId: number,
  dLedgerNo: string,
  pExtTransactionId:string
}
export interface bAccounts {
  accountNo: string,  
  accountTypeExt: number,  
  Information: string,  
  clientId: number,  
  currencyCode: number,  
  entityTypeCode: number, 
  accountId: number,
  idportfolio: number
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
export interface bAccountsEntriesList {
  d_transactionType:string,
  t_id: number,
  t_entryDetails:string,
  t_ledgerNoId: number, 
  t_accountId: number, 
  t_extTransactionId : number, 
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
} 
export interface cFormValidationLog {
  t_extTransactionId: number;
  formReference: string;
  fieldName: string;
  fieldDescription: string;
  errorMsg: string;
  kKeyError: string,
  errorCode: string
}

export interface moexMarketDataForiegnShres {
  secid: string,
  marketprice: number,
  reportingDate: string
}
export interface marketData {
  globalsource:string,
  sourcecode: string,
  boardid: string, 
  shortname: number, 
  secid: string, 
  numtrades: number, 
  value: number, 
  open: number, 
  low: number, 
  high: number, 
  legalcloseprice: number,
  waprice: number,
  close: number, 
  volume: number,
  marketprice2: number,
  marketprice3: number, 
  admittedquote: number, 
  mp2valtrd: number,
  marketprice3tradesvalue: number,
  admittedvalue: number,
  waval: number, 
  tradingsession: string,
  tradedate: string
}

export interface marketSourceSegements {
  id:string,
  sourceGlobal:string,
  description: string,
  sourceCode : string,
  checked:boolean,
  sourceURL: string,
  params:{
    date: string,
    'history.colums': string,
    'iss.json':string,
    'iss.meta':string,
    start: number
  }
}
export interface marketDataSources {
  disabled:boolean,
  segments :marketSourceSegements [],
  sourceName : string,
  checkedAll:boolean,
  indeterminate:boolean

}
export interface InstrumentsMapCodes {
  secid:string,
  code:string[],
  isin:string,
  mapcode:string
}
export interface Instruments  {
  id :number,
  secid: string, 
  security_type_title: string,
  stock_type: number, 
  security_type_name: string, 
  shortname: string, 
  primary_boardid: string, 
  board_title: string, 
  title: string,
  category: string, 
  name: string, 
  isin: string, 
  emitent_title: string, 
  emitent_inn: string, 
  type: string, 
  group: string, 
  marketprice_boardid: string,
  group_title: string,
  security_group_name: string,
  action: string
}
export interface instrumentDetails {
  secid: string, boardid: string, shortname: string, lotsize: number, facevalue: number, status: string, boardname: string, decimals: number, matdate: Date, secname: string, couponperiod: string, issuesize: number, remarks: string, marketcode: string, instrid: string, sectorid: string, minstep: number, faceunit: number, isin: string, latname: string, regnumber: string, currencyid: string, sectype: string, listlevel: number, issuesizeplaced: number, couponpercent: string, lotvalue: number, nextcoupon: string, issuevolume:number
}
export interface instrumentCorpActions {
  id: number, isin: string, issuevolume: number, secname: string, notinal: number, notinalcurrency: string, unredemeedvalue: number, couponrate: number, couponamount: number, actiontype: string, couponamountrur: number, date: Date, action: string

}