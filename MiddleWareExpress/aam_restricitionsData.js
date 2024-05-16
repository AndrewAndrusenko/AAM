const db_common_api = require('./db_common_api');
var pgp = require ('pg-promise')({capSQL:true});

async function geRestrictionsData (request,response) {
  let sql='';
  switch (request.query.action) {
    case 'getVerificationForAllocation':
      sql=' SELECT dor.id as id_order, dor.corrected_qty as order_qty, dor.parent_order, vor.* '+
          ' FROM f_i_allocation_orders(${qtyForAllocation}::numeric,ARRAY[${ordersForExecution}]) dor '+
          ' LEFT JOIN LATERAL '+
          ' (SELECT * FROM '+
          ' f_i_r_verify_allocation_vs_restrictions(array[dor.id_portfolio],dor.corrected_qty*${p_trade_price}::numeric,${p_alloc_secid},${p_verification_type}::int)) vor '+
          ' ON vor.id=dor.id_portfolio '+
          ' WHERE corrected_qty!=0 AND vor.new_mtm NOTNULL; ' 
    break;
    case 'getRestrictionsDataMain':
      sql='SELECT*, 0 as action FROM f_r_get_portfolios_with_restrictions_schemes(${p_idportfolios},${p_portfolios_codes});'
    break;
    case 'getRestrictionsVerification':
      sql='SELECT * FROM f_i_r_verify_restrictions_v2(${p_portfolios_codes});'
    break;
    case 'getRestrictionsObjects':
      sql='SELECT id, object_code, object_id, object_description, object_group, object_owner FROM public.d_i_restrictions_objects;'
    break;
  }
  request = db_common_api.getTransformArrayParam(request,['p_idportfolios','ordersForExecution']);
  sql = pgp.as.format(sql,request.query);
  sql = db_common_api.sqlReplace(sql)
  db_common_api.queryExecute(sql,response,undefined,request.query.action,undefined);
}
async function fupdateRestrictionMainData (request, response) {
  let fields = [ 'idportfolio', 'restriction_type_id', 'value', 'param']
 db_common_api.fUpdateTableDB ('d_i_restrictions',fields,'id',request, response)
}
module.exports = {
  geRestrictionsData,
  fupdateRestrictionMainData
}