const db_common_api = require('./db_common_api');
var pgp = require ('pg-promise')({capSQL:true});
async function fGetTradesData (request,response) {
  let sql = '';
  let conditions = {};
  conditions = {
    'idtrade':{
      1: '(dtrades.idtrade =  ${idtrade})',
      2: '(dtrades_allocated.idtrade =  ${idtrade})'
    },
    'type':{
      1: '(trtype =  ${type})',
      2: '(trtype =  ${type})',
    },
    'qty':{
      1: '(qty BETWEEN ${qty_min} AND ${qty_max})',
      2: '(dtrades_allocated.qty BETWEEN ${qty_min} AND ${qty_max})',
    },
    'price': {
      1: '(price BETWEEN ${price_min} AND ${price_max})',
      2: '(price BETWEEN ${price_min} AND ${price_max})',
    },
    'tdate_min': {
      1: '(tdate::timestamp without time zone >= ${tdate_min}::date )',
      2: '(tdate::timestamp without time zone >= ${tdate_min}::date )',
    },
    'tdate_max': {
      1: '(tdate::timestamp without time zone <= ${tdate_max}::date )',
      2: '(tdate::timestamp without time zone <= ${tdate_max}::date )',
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
      2: '(LOWER(tidinstrument) = ANY(array[${secidList}]))  ',
    }
  }
  let conditionsTrades =' WHERE'
  Object.entries(conditions).forEach(([key,value]) => {
  if  (request.query.hasOwnProperty(key)) {
    request.query[key]!=='null'? conditionsTrades +=conditions[key][1] + ' AND ': null;
    }
  });
  let conditionsAllocatedTrades =' WHERE'
  Object.entries(conditions).forEach(([key,value]) => {
  if  (request.query.hasOwnProperty(key)) {
    request.query[key]!=='null'? conditionsAllocatedTrades +=conditions[key][2] + ' AND ': null;
    }
  });
  switch (request.query.action) {
    case 'getAllocationTrades':
      sql='SELECT dtrades_allocated.id, dtrades_allocated.qty, dtrades_allocated.idtrade, dtrades_allocated.idportfolio, id_order,dtrades_allocated.id_bulk_order, dportfolios.portfolioname, ROUND(dtrades.trade_amount/dtrades.qty*dtrades_allocated.qty,2) as trade_amount, dtrades.accured_interest,id_settlement_currency, "bAccounts"."accountId","bAccountsDepo"."accountId" as "depoAccountId", "entriesForAllocation".count as "entries",dtrades.tidinstrument as secid,dtrades.tdate,dtrades.trtype,dtrades.price,dtrades.id_price_currency ';
      request.query.balances==='true'?  sql+= ', b_accounts_balance."closingBalance" as current_account_balance,b_depo_accounts_balance."closingBalance" as depo_account_balance,f_fifo_select_current_positions_for_trade.position as fifo ' : null;
      sql+= ' FROM public.dtrades_allocated '+
      'LEFT JOIN dtrades ON dtrades_allocated.idtrade = dtrades.idtrade '+
      'LEFT JOIN dportfolios ON dtrades_allocated.idportfolio = dportfolios.idportfolio '+
      'LEFT JOIN (SELECT * FROM "bAccounts" WHERE "bAccounts"."accountTypeExt"=8) as "bAccounts"  ON dtrades_allocated.idportfolio = "bAccounts".idportfolio '+
      'LEFT JOIN (SELECT * FROM "bAccounts" WHERE "bAccounts"."accountTypeExt"=15) as "bAccountsDepo"  ON (dtrades_allocated.idportfolio = "bAccountsDepo".idportfolio  and dtrades.tidinstrument="bAccountsDepo".secid)'+
      'LEFT JOIN "entriesForAllocation" ON dtrades_allocated.id = "entriesForAllocation".idtrade ';
      request.query.balances==='true'? sql+= 'LEFT JOIN  '+
      '(SELECT * FROM f_fifo_select_current_positions_for_trade(${secid})) '+
      'AS f_fifo_select_current_positions_for_trade on dtrades_allocated.idportfolio = f_fifo_select_current_positions_for_trade.idportfolio ' +
      'LEFT JOIN LATERAL ('+
      '  SELECT "accountId", "openingBalance", CAST ("closingBalance" AS NUMERIC) AS "closingBalance", "closingBalance" AS "EndBalance"'+
      '    FROM f_checkoverdraftbyaccountandbydate'+
      '    (dtrades.tdate, "bAccounts"."accountId", 1, 0, 0, ${firstOpenedAccountingDate})) as b_accounts_balance '+
      '    ON "bAccounts"."accountId"=b_accounts_balance."accountId" '+
      '  LEFT JOIN LATERAL ('+
      '  SELECT "accountId", "openingBalance", CAST ("closingBalance" AS NUMERIC) AS "closingBalance", "closingBalance" AS "EndBalance"'+
      '    FROM f_checkoverdraftbyaccountandbydate'+
      '    (dtrades.tdate, "bAccountsDepo"."accountId", 1, 0, 0, ${firstOpenedAccountingDate})) as b_depo_accounts_balance '+
      '    ON "bAccountsDepo"."accountId"=b_depo_accounts_balance."accountId" ': null;
          
      sql +=conditionsAllocatedTrades.slice(0,-5) + 'ORDER BY dtrades_allocated.idtrade DESC;'
    break;
    default:
      sql = 'SELECT details, dclients.clientname as cpty_name , mmoexsecuritytypes.security_group_name,mmoexsecuritytypes.security_type_name as secid_type, mmoexsecurities.name as secid_name, dtrades.idtrade, qty, price, dclients.clientname as cpty, tdate, vdate, tidorder, allocated_qty.alloaction as allocatedqty, idportfolio, trtype, tidinstrument, id_broker, id_price_currency, id_settlement_currency, id_buyer_instructions, id_seller_instructions, accured_interest, fee_trade, fee_settlement, fee_exchange, id_cpty, mmoexsecuritytypes.price_type, trade_amount,faceunit,facevalue,settlement_amount, settlement_rate '+
      'FROM public.dtrades ' +
      'LEFT JOIN (SELECT dtrades_allocated.idtrade, sum (qty) as alloaction FROM  public.dtrades_allocated GROUP BY dtrades_allocated.idtrade) allocated_qty ON allocated_qty.idtrade=dtrades.idtrade '+
      'LEFT JOIN mmoexsecurities ON dtrades.tidinstrument = mmoexsecurities.secid '+
      'LEFT JOIN mmoexsecuritytypes ON mmoexsecurities.type=mmoexsecuritytypes.security_type_name '+
      'LEFT JOIN dclients ON dclients.idclient = dtrades.id_cpty ';
      sql +=conditionsTrades.slice(0,-5) + 'ORDER BY dtrades.tdate DESC;'
    break;
}
  sql = pgp.as.format(sql,request.query);
  db_common_api.queryExecute(sql,response,undefined,request.query.action ||'GetTradesData');
}
async function fGetAccuredInterest (request,response) {
  let sql = 'SELECT couponrate,actiontype,currency, date::timestamp without time zone   FROM public.mmoexcorpactions where secid=${tidinstrument} AND  date <= (select min(date) FROM public.mmoexcorpactions where date > ${vdate} and secid=${tidinstrument}) ORDER BY date desc LIMIT 2'
  sql = pgp.as.format(sql,request.query);
  db_common_api.queryExecute(sql,response,undefined,'GetAccuredInterest');
}
async function fUpdateTradeData (request, response) {
  let fields = ['qty','price','tdate','vdate','trtype','tidinstrument','id_broker','id_price_currency','id_settlement_currency','id_buyer_instructions','id_seller_instructions','accured_interest','fee_trade','fee_settlement','fee_exchange','price_type','id_cpty','details','trade_amount','settlement_amount','settlement_rate']
  let dates=['tdate','vdate']
 db_common_api.fUpdateTableDB ('dtrades',fields,'idtrade',request, response,dates)
}
async function fGetOrderData (request,response) {
  let conditions = {}
  conditions = {
    'id':{
      1: '( dorders.id::text =  ANY(ARRAY[${id}]))',
    },
    'idtrade':{
      1: '(idtrade =  ${idtrade})',
    },
    'type':{
      1: '(dorders."type" =  ${type})',
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
      1: '(LOWER(dorders.secid) = ANY(array[${secidList}]))  ',
    }
  }
  let conditionsTrades =' WHERE'
  Object.entries(conditions).forEach(([key,value]) => {
  if  (request.query.hasOwnProperty(key)) {
    request.query[key]!=='null'? conditionsTrades +=conditions[key][1] + ' AND ': null;
    }
  });
  let sql = 'SELECT mmoexsecuritytypes.security_group_name,mmoexsecuritytypes.security_type_name as secid_type, mmoexsecurities.name as secid_name, mmoexsecuritytypes.price_type, dorders.id, generated, dorders.type, dorders.secid, dorders.qty, price, amount, qty_executed, status, parent_order, id_portfolio, dportfolios.portfolioname, ordertype, idcurrency,"dCurrencies"."CurrencyCode" as currencycode, 0 as action, coalesce(allocated_qty.allocated,0) as allocated,  dorders.qty-coalesce(allocated_qty.allocated, 0) as unexecuted '+
  'FROM public.dorders ' +
  'LEFT JOIN "dCurrencies" ON dorders.idcurrency = "dCurrencies"."CurrencyCodeNum" ' + 
  'LEFT JOIN (SELECT COALESCE(id_order,id_bulk_order) as id_joined,id_order,id_bulk_order, sum(dtrades_allocated.qty) AS allocated '+
              'FROM public.dtrades_allocated GROUP BY  GROUPING SETS ((id_order),(id_bulk_order)) '+
  ')  as allocated_qty on allocated_qty.id_joined=dorders.id '+
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
      sql = 'SELECT * from public.f_create_bulk_orders(array[${clientOrders}])'; 
    break;
    case 'ordersStatusChange':
      sql='UPDATE dorders '+
          'SET status = ${newStatus} '+
          'WHERE id = ANY(ARRAY[${ordersToUpdate}]) OR parent_order = ANY(ARRAY[${ordersToUpdate}])   '+
          'RETURNING id,status;';
    break;
  }
  sql = pgp.as.format(sql,request.body);
  db_common_api.queryExecute(sql,response,undefined,request.body.action);
}
async function fAllocation(request,response) {
  let sql = '';
  switch (request.body.action) {
    case 'executeOrders':
      sql= 'WITH allocation as (INSERT INTO public.dtrades_allocated(qty, idtrade, idportfolio, id_order,id_bulk_order) '+
           'SELECT corrected_qty,${tradeId},id_portfolio,id,parent_order FROM f_i_allocation_orders(${qtyForAllocation},ARRAY[${ordersForExecution}]) RETURNING *) '+
           'SELECT COALESCE(id_order,id_bulk_order,idtrade) as id_joined,id_order,id_bulk_order,idtrade, sum(allocation.qty) AS allocated '+
           'FROM allocation GROUP BY  GROUPING SETS ((id_order),(id_bulk_order),(idtrade)); ';
    break;
    case 'deleteAllocation':
      sql = 'DELETE FROM dtrades_allocated WHERE id=ANY(ARRAY[${tradesIDs}]) RETURNING *'; 
    break;
  }
  sql = pgp.as.format(sql,request.body.data);
  db_common_api.queryExecute(sql,response,undefined,request.body.action);
}
module.exports = {
  fGetTradesData,
  fGetAccuredInterest,
  fUpdateTradeData,
  fGetOrderData,
  fUpdateOrderData,
  fModifyBulkOrder,
  fAllocation
}