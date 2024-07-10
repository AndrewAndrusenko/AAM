export type FeesMainWithSchedules = FeesMainData|FeesSchedulesData
export interface FeesPortfoliosWithSchedulesData extends FeesMainData {
  id_fee:number,
  main_fee_object_type :number,
  object_id:number,
  id_fee_main :number,
  period_start:Date,
  period_end:Date, 
  created:Date, 
  modified:Date,
  action:number,
  portfolioname:string
}
export interface dFeesObject {
  id :number, 
  object_id :number, 
  id_fee_main :number, 
  period_start :Date, 
  period_end :Date, 
  created :Date,
  modified :Date
}
export interface FeesMainData {
  id :number,
  fee_code:number,
  fee_type_desc: string,
  fee_object_desc: string,
  fee_description: string,
  period_desc: string,
  fee_type:number,
  fee_object_type :number,
  id_fee_period :number,
  portfolios: string
}
export interface FeesSchedulesData {
  idfee_scedule :number, 
  fee_type_value :number,
  feevalue :number,
  calculation_period :number, 
  deduction_period :number,
  schedule_range: number[],
  range_parameter:string, 
  below_ranges_calc_type:number, 
  id_fee_main:number, 
  pf_hurdle:number,
  highwatermark:boolean
}
export interface ManagementFeeCalcData {
  report_date : Date,
  id_portfolio : number,
  portfolioname : string,
  management_fee_amount : number,
  npv : number,
  fee_code : string,
  calculation_start : Date,
  calculation_end : Date,
  period_start : Date,
  period_end : Date,
  schedule_range : number,
  feevalue : number,
  fee_type_value  :number,
  id_fee_transaction: number
}
export type FeesTransactions = {
  id :number,
  id_object :number,
  fee_object_type:number,
  fee_amount:number, 
  fee_date:Date, 
  calculation_date :Date, 
  b_transaction_date :Date, 
  id_b_entry1:number[], 
  fee_rate:number, 
  calculation_base:number, 
  id_fee_main:number, 
  fee_type:number,
  portfolioname: string,
  fee_code:string,
  id_fee_transaction:number,
  accountId:number,
  endPeriod:Date,
  startPeriod:Date,
  account_balance:number,
  pl: number, 
  hwm: number
}
export interface ManagementFeeCalcData {
  report_date : Date,
  id_portfolio : number,
  portfolioname : string,
  management_fee_amount : number,
  npv : number,
  fee_code : string,
  calculation_start : Date,
  calculation_end : Date,
  period_start : Date,
  period_end : Date,
  schedule_range : number,
  feevalue : number,
  fee_type_value  :number,
  id_fee_transaction: number
}
export interface PerformanceFeeCalcData {
  portfolioname: string , 
  pos_pv : number,
  cash_flow : number,
  fee_amount : number ,
  pl : number,
  pl_above_hwm : number,
  feevalue : number,
  hwm : number,
  id_Calc: number
}