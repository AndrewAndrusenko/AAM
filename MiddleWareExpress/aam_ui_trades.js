const db_common_api = require('./db_common_api');
async function fGetTradesData (request,response) {
  let sql = 'SELECT details, dclients.clientname as cpty_name , mmoexsecuritytypes.security_group_name,mmoexsecuritytypes.security_type_name as secid_type, mmoexsecurities.name as secid_name, idtrade, qty, price, cpty, tdate, vdate, tidorder, allocatedqty, idportfolio, trtype, tidinstrument, id_broker, id_price_currency, id_settlement_currency, id_buyer_instructions, id_seller_instructions, accured_interest, fee_trade, fee_settlement, fee_exchange, price_type, id_cpty '+
  'FROM public.dtrades ' +
	'LEFT JOIN mmoexsecurities ON dtrades.tidinstrument = mmoexsecurities.secid '+
  'LEFT JOIN mmoexsecuritytypes ON mmoexsecurities.type=mmoexsecuritytypes.security_type_name '+
	'LEFT JOIN dclients ON dclients.idclient = dtrades.id_cpty;'
  db_common_api.queryExecute(sql,response,undefined,'GetTradesData');
}
module.exports = {
  fGetTradesData
}