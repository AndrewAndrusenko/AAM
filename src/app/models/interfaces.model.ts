import { DBConfig } from "ngx-indexed-db";

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
export interface tableHeaders {
  fieldName:string,
  displayName:string
}

export const portfolioTypes :portfolioType [] = [
  {value: 1, viewValue: 'Model Portfolio'},
  {value: 2, viewValue: 'Strategy (based on MP)'},
]
export interface formInitParams {
  action:string
  filterData: {
    field:string
    value:string|number
  },
  readOnly:boolean|null
}
export interface AccountsTableModel {
 idportfolio:number;
 idclient:number;
 idstategy:number;
 sname:string;
 portfolioname:string;
 portleverage:number; 
 action:number
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
export interface objectStatus {
  id_object:string, status_code:string,step:number
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
  action:number
}
export interface counterParty {
  idclient:number, 
  clientname:string,
  code:string
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
  action:number
}
export interface StrategyStructure {
  id_strategy_parent?: number, 
  id? : string, 
  sname? : string,
  isin?:string,
  name?:string,
  description?: string;
  weight_of_child? : number,
  id_item?:number,
  id_strategy_child?:string,
  id_strategy_child_integer?:number,
  user_id?:number,
  old_weight?:number
}
export interface PortfoliosHistory extends AccountsTableModel {
  transaction_date:Date,
  type:number,
  user:number,
  user_login:string,
  type_trans:string,
  clientname:string,
  strategy_name:string
}
export interface StrategyStructureHistory extends StrategyStructure {
  tr_date:Date,
  type:number,
  user:number,
  user_login:string,
  type_trans:string
  isin: string, 
  sec_name: string
}
export interface accountTypes {
  typeCode: string, 
  typeValue: string,
  typeDescription: string
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
  id?:number,
  globalsource?:string,
  sourcecode?: string,
  boardid?: string, 
  shortname?: number, 
  secid?: string, 
  numtrades?: number, 
  value?: number|null, 
  open?: number|null, 
  low?: number|null, 
  high?: number|null, 
  legalcloseprice?: number,
  waprice?: number,
  close?: number|null, 
  volume?: number,
  marketprice2?: number,
  marketprice3?: number, 
  admittedquote?: number, 
  mp2valtrd?: number,
  marketprice3tradesvalue?: number,
  admittedvalue?: number,
  waval?: number, 
  tradingsession?: string,
  tradedate?: string
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
    start: number,
    date_from?: string,
    date_to?:string,
    symbols?:string
  }
}
export interface marketDataSources {
  type:string;
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
export interface trades {
  idtrade:number,qty:number,price:number,accured_interest:number,fee_trade:number,fee_settlement:number,fee_exchange:number,tdate:Date,vdate:Date,tidorder:number,allocatedqty:number,idportfolio:number,id_price_currency:number,id_settlement_currency:number,id_buyer_instructions:number,id_seller_instructions:number,id_cpty:string,tidinstrument:string,id_broker:string,trtype:string, action:number,price_type:number,details:string,cpty_name:string , security_group_name :string, secid_type:string,  secid_name:string, trade_amount:number,faceunit:number,facevalue:number,settlement_amount:number, settlement_rate:number,price_currency_name:string,balance_qty:number,fifo_qty:number
}
export interface couponPeriodInfo {
  couponrate:number,actiontype:number,currency:number, coupon_date:Date
}

export interface currencyRate {
  rate_date:Date, baseCode:number, quoteCode:number, rate:number
}
export interface currencyRateList extends currencyRate {
  id:number, base_iso:string, quote_iso :string , rate_type:number, nominal:number, pair:string,sourcecode:string, inderect_rate: number
}
export interface currencyCode {
  CurrencyCodeNum :number,
  CurrencyCode:string,
  CurrencyName:string, 
  symbol:string 
}
export interface currencyPair {
id: number, 
pair:string, 
base :number, 
quote :number, 
nominal:number
}
export interface orders {
  id:number, generated:Date, type:string, secid:string, qty:number, price:number, amount:number, qty_executed:number, status:string, parent_order:number, id_portfolio:number,portfolioname:string, ordertype:string, idcurrency:number,currencycode:string, security_group_name:string,secid_type:string,secid_name:string, price_type:number, action:string, allocated:number,unexecuted:number,
  mp_name:string
}
export interface allocation {
  id:number, qty:number, idtrade:number, idportfolio:number, id_order:number,id_bulk_order:number, portfolioname: string,trade_amount:number, accured_interest:number,id_settlement_currency:number, accountId:number,depoAccountId:number,entries:number,current_account_balance:number, depo_account_balance:number,  secid: string,tdate:Date,trtype:string,price:number,id_price_currency:number,fifo:number,pl:number, mp_name: string,cpty_code:string
}
export interface allocation_fifo {
  id: number,idtrade : number,tr_type : number,qty : number,qty_out : number,price_in : number,price_out : number,closed: boolean,idportfolio : number,trade_date: Date,secid: string,generated: Date,profit_loss : number,id_sell_trade : number,id_buy_trade 
}
export interface portfolioPositions{
  not_zero_npv:boolean,
  deviation_percent: number,
  roi: number,
  total_pl: number,
  unrealizedpl: number,
  pl: number,
  cost_in_position: number,
  cost_full_position:number,
  idportfolio: number, 
  portfolio_code  :string,
  secid  :string,
  strategy_name  :string,
  mp_name  :string,
  fact_weight  :number, 
  current_balance  :number, 
  mtm_positon :number, 
  weight  :number, 
  planned_position: number, 
  order_amount :number, 
  order_type :string, 
  order_qty  :number, 
  mtm_rate  :number, 
  mtm_date: Date, 
  mtm_dirty_price  :number, 
  cross_rate  :number, 
  npv  :number, 
  rate_date: Date, 
  main_currency_code  :number
}
export interface PortfolioPerformnceData {
  portfolioname : string, report_date : Date, npv : number, roi_current_period : number, time_wighted_roi : number, last_npv : number, cash_flow : number, correction_rate : number, correction_rate_compound : number, period_start_date : Date
}
export interface NPVDynamicData {
report_date :Date, portfolioname :string, accountNo :string, secid :string, balance :number, pos_pv :number, mtm_rate :number, mtm_date :Date, boardid :string, percentprice: boolean, couponrate :number, nominal_currency :string, board_currency :number, cross_rate :number, accured :number, dirty_price :number, rate_date :Date 
}
export interface RevenueFactorData {
  cross_rate :number,
	rate_date :Date,
	report_date :Date, 
	portfolioname: string,  
	secid: string, 
	total_pl :number,
	mtm_pl :number,
	pl :number,
	current_fifo_position_cost :number,
	account_currency_code: number,
	idportfolio :number,
	balance :number, 
	pos_pv :number, 
	mtm_rate :number, 
	mtm_date :Date,  
	dirty_price :number,
  mtm_cross_rate: number
}
