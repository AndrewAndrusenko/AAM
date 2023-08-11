const db_common_api = require('./db_common_api');
var pgp = require ('pg-promise')({capSQL:true});
async function fGetTradesData (request,response) {
  let conditions = {}
  conditions = {
    'qty':{
      1: '(qty BETWEEN ${qty_min} AND ${qty_max})',
    },
    'price': {
      1: '(price BETWEEN ${price_min} AND ${price_max})',
    },
    'tdate_min': {
      1: '(tdate::timestamp without time zone >= ${tdate_min}::date )',
    },
    'tdate_max': {
      1: '(tdate::timestamp without time zone <= ${tdate_max}::date )',
    },
    'vdate_min': {
      1: '(vdate::timestamp without time zone >= ${vdate_min}::date )',
    },
    'vdate_max': {
      1: '(vdate::timestamp without time zone <= ${vdate_max}::date )',
    },
    'cptyList' : {
      1: '(id_cpty = ANY(array[${cptyList}]))  ',
    },
    'secidList' : {
      1: '(tidinstrument = ANY(array[${secidList}]))  ',
    }
  }
  let conditionsTrades =' WHERE'
  Object.entries(conditions).forEach(([key,value]) => {
  if  (request.query.hasOwnProperty(key)) {
    console.log('value',request.query[key],request.query[key]!=='null' );
    request.query[key]!=='null'? conditionsTrades +=conditions[key][1] + ' AND ': null;
    }
  });
  console.log('fGetTradesData',request.query);
  console.log('fGetTradesData',JSON.stringify(request.query.qty));
  let sql = 'SELECT details, dclients.clientname as cpty_name , mmoexsecuritytypes.security_group_name,mmoexsecuritytypes.security_type_name as secid_type, mmoexsecurities.name as secid_name, idtrade, qty, price, dclients.clientname as cpty, tdate, vdate, tidorder, allocatedqty, idportfolio, trtype, tidinstrument, id_broker, id_price_currency, id_settlement_currency, id_buyer_instructions, id_seller_instructions, accured_interest, fee_trade, fee_settlement, fee_exchange, id_cpty, mmoexsecuritytypes.price_type, trade_amount,faceunit,facevalue,settlement_amount, settlement_rate '+
  'FROM public.dtrades ' +
	'LEFT JOIN mmoexsecurities ON dtrades.tidinstrument = mmoexsecurities.secid '+
  'LEFT JOIN mmoexsecuritytypes ON mmoexsecurities.type=mmoexsecuritytypes.security_type_name '+
	'LEFT JOIN dclients ON dclients.idclient = dtrades.id_cpty ';
  sql +=conditionsTrades.slice(0,-5) + 'ORDER BY idtrade DESC;'
  console.log('sql',sql);
  sql = pgp.as.format(sql,request.query);
  console.log('sql',sql);
  db_common_api.queryExecute(sql,response,undefined,'GetTradesData');
}
async function GetAccuredInterest (request,response) {
  // let sql = 'SELECT couponrate,actiontype,currency, min(date)::timestamp without time zone as coupon_date FROM public.mmoexcorpactions where secid=${tidinstrument} and date > ${vdate} GROUP BY couponrate,actiontype,currency;'
  let sql = 'SELECT couponrate,actiontype,currency, date  FROM public.mmoexcorpactions where secid=${tidinstrument} AND '+
          'date <= (select min(date) FROM public.mmoexcorpactions where date > ${vdate} and secid=${tidinstrument}) ORDER BY date desc LIMIT 2'
  sql = pgp.as.format(sql,request.query);
  db_common_api.queryExecute(sql,response,undefined,'GetAccuredInterest');
}
module.exports = {
  fGetTradesData,
  GetAccuredInterest
}