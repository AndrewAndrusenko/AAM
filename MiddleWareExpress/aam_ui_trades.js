const db_common_api = require('./db_common_api');
async function fGetTradesData (request,response) {
  let sql = 'SELECT idtrade, qty, price, cpty, tdate::timestamp without time zone, vdate::timestamp without time zone, tidorder, allocatedqty, idportfolio, trtype, tidinstrument, id_broker, id_price_currency, id_settlement_currency, id_buyer_instructions, id_seller_instructions, accured_interest, fee_trade, fee_settlement, fee_exchange, 0 as action FROM public.dtrades;';
  db_common_api.queryExecute(sql,response,undefined,'GetTradesData');
}
module.exports = {
  fGetTradesData
}