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
