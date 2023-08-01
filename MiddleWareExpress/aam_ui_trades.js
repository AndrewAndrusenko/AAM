const db_common_api = require('./db_common_api');
var pgp = require ('pg-promise')({capSQL:true});
async function fGetTradesData (request,response) {
  let sql = 'SELECT details, dclients.clientname as cpty_name , mmoexsecuritytypes.security_group_name,mmoexsecuritytypes.security_type_name as secid_type, mmoexsecurities.name as secid_name, idtrade, qty, price, cpty, tdate, vdate, tidorder, allocatedqty, idportfolio, trtype, tidinstrument, id_broker, id_price_currency, id_settlement_currency, id_buyer_instructions, id_seller_instructions, accured_interest, fee_trade, fee_settlement, fee_exchange, id_cpty, mmoexsecuritytypes.price_type, trade_amount,faceunit,facevalue '+
  'FROM public.dtrades ' +
	'LEFT JOIN mmoexsecurities ON dtrades.tidinstrument = mmoexsecurities.secid '+
  'LEFT JOIN mmoexsecuritytypes ON mmoexsecurities.type=mmoexsecuritytypes.security_type_name '+
	'LEFT JOIN dclients ON dclients.idclient = dtrades.id_cpty ORDER BY idtrade DESC;'
  db_common_api.queryExecute(sql,response,undefined,'GetTradesData');
}
async function GetAccuredInterest (request,response) {
  console.log('GetAccuredInterest',request.query);
  let sql = 'SELECT couponrate,actiontype,currency, min(date)::timestamp without time zone as coupon_date FROM public.mmoexcorpactions where secid=${tidinstrument} and date > ${vdate} GROUP BY couponrate,actiontype,currency;'
  sql = pgp.as.format(sql,request.query);
  console.log('GetAccuredInterest',sql,request.query);
  db_common_api.queryExecute(sql,response,undefined,'GetAccuredInterest');
}
module.exports = {
  fGetTradesData,
  GetAccuredInterest
}