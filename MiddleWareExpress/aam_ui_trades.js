const db_common_api = require('./db_common_api');
var pgp = require ('pg-promise')({capSQL:true});
async function fGetTradesData (request,response) {
  let conditions = {}
  conditions = {
    'idtrade':{
      1: '(idtrade =  ${idtrade})',
    },
    'type':{
      1: '(trtype =  ${type})',
    },
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
      1: '(LOWER(dclients.clientname) = ANY(array[${cptyList}]))  ',
    },
    'secidList' : {
      1: '(LOWER(tidinstrument) = ANY(array[${secidList}]))  ',
    }
  }
  let conditionsTrades =' WHERE'
  Object.entries(conditions).forEach(([key,value]) => {
  if  (request.query.hasOwnProperty(key)) {
    request.query[key]!=='null'? conditionsTrades +=conditions[key][1] + ' AND ': null;
    }
  });
  let sql = 'SELECT details, dclients.clientname as cpty_name , mmoexsecuritytypes.security_group_name,mmoexsecuritytypes.security_type_name as secid_type, mmoexsecurities.name as secid_name, idtrade, qty, price, dclients.clientname as cpty, tdate, vdate, tidorder, allocatedqty, idportfolio, trtype, tidinstrument, id_broker, id_price_currency, id_settlement_currency, id_buyer_instructions, id_seller_instructions, accured_interest, fee_trade, fee_settlement, fee_exchange, id_cpty, mmoexsecuritytypes.price_type, trade_amount,faceunit,facevalue,settlement_amount, settlement_rate '+
  'FROM public.dtrades ' +
	'LEFT JOIN mmoexsecurities ON dtrades.tidinstrument = mmoexsecurities.secid '+
  'LEFT JOIN mmoexsecuritytypes ON mmoexsecurities.type=mmoexsecuritytypes.security_type_name '+
	'LEFT JOIN dclients ON dclients.idclient = dtrades.id_cpty ';
  sql +=conditionsTrades.slice(0,-5) + 'ORDER BY idtrade DESC;'
  sql = pgp.as.format(sql,request.query);
  db_common_api.queryExecute(sql,response,undefined,'GetTradesData');
}
async function fGetAccuredInterest (request,response) {
  let sql = 'SELECT couponrate,actiontype,currency, date::timestamp without time zone   FROM public.mmoexcorpactions where secid=${tidinstrument} AND  date <= (select min(date) FROM public.mmoexcorpactions where date > ${vdate} and secid=${tidinstrument}) ORDER BY date desc LIMIT 2'
  sql = pgp.as.format(sql,request.query);
  db_common_api.queryExecute(sql,response,undefined,'GetAccuredInterest');
}
async function fUpdateTradeData (request, response) {
  let fields = ['idtrade','qty','price','tdate','vdate','trtype','tidinstrument','id_broker','id_price_currency','id_settlement_currency','id_buyer_instructions','id_seller_instructions','accured_interest','fee_trade','fee_settlement','fee_exchange','price_type','id_cpty','details','trade_amount','settlement_amount','settlement_rate']
  let dates=['tdate','vdate']
 db_common_api.fUpdateTableDB ('dtrades',fields,'idtrade',request, response,dates)
}
async function fGetOrderData (request,response) {
  let conditions = {}
  conditions = {
    'idtrade':{
      1: '(idtrade =  ${idtrade})',
    },
    'type':{
      1: '(trtype =  ${type})',
    },
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
    'secidList' : {
      1: '(LOWER(secid) = ANY(array[${secidList}]))  ',
    }
  }
  let conditionsTrades =' WHERE'
  Object.entries(conditions).forEach(([key,value]) => {
  if  (request.query.hasOwnProperty(key)) {
    request.query[key]!=='null'? conditionsTrades +=conditions[key][1] + ' AND ': null;
    }
  });
  let sql = 'SELECT mmoexsecuritytypes.security_group_name,mmoexsecuritytypes.security_type_name as secid_type, mmoexsecurities.name as secid_name, mmoexsecuritytypes.price_type, dorders.id, generated, dorders.type, dorders.secid, qty, price, amount, qty_executed, status, parent_order, id_portfolio, dportfolios.portfolioname, ordertype, idcurrency,"dCurrencies"."CurrencyCode" as currencycode, 0 as action '+
  'FROM public.dorders ' +
  'LEFT JOIN "dCurrencies" ON dorders.idcurrency = "dCurrencies"."CurrencyCodeNum"' +
	'LEFT JOIN dportfolios ON dorders.id_portfolio = dportfolios.idportfolio '+
	'LEFT JOIN mmoexsecurities ON dorders.secid = mmoexsecurities.secid '+
  'LEFT JOIN mmoexsecuritytypes ON mmoexsecurities.type=mmoexsecuritytypes.security_type_name ';
  sql +=conditionsTrades.slice(0,-5) + 'ORDER BY dorders.id DESC;'
  sql = pgp.as.format(sql,request.query);
  db_common_api.queryExecute(sql,response,undefined,'GetOrderData');
}
async function fUpdateOrderData (request, response) {
  let fields = ['status']
 db_common_api.fUpdateTableDB ('dorders',fields,'id',request, response)
}
async function fModifyBulkOrder (request,response) {
  let sql = '';
  switch (request.body.action) {
    case 'unmergerBulkOrder':
      sql = 'SELECT * FROM public.f_delete_bulk_orders(array[${bulkOrders}])'; 
    break;
    case 'createBulkOrder':
      console.log('createBulkOrder id', request.body);
      sql = 'SELECT * from public.f_create_bulk_orders(array[${clientOrders}])'; 
    break;
  }
  sql = pgp.as.format(sql,request.body);
  db_common_api.queryExecute(sql,response,undefined,request.body.action);
}
module.exports = {
  fGetTradesData,
  fGetAccuredInterest,
  fUpdateTradeData,
  fGetOrderData,
  fUpdateOrderData,
  fModifyBulkOrder
}