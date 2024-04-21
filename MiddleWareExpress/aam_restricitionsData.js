const db_common_api = require('./db_common_api');
var pgp = require ('pg-promise')({capSQL:true});

async function geRestrictionsData (request,response) {
  let sql='';
  switch (request.query.action) {
    case 'getRestrictionsDataMain':
      sql='SELECT*, 0 as action from f_r_get_portfolios_with_restrictions_schemes(${p_idportfolios},${p_portfolios_codes});'
    break;
    case 'getRestrictionsObjects':
      sql='SELECT id, object_code, object_id, object_description, object_group, object_owner FROM public.d_i_restrictions_objects;'
    break;
  }
  request = db_common_api.getTransformArrayParam(request,['p_idportfolios']);

  sql = pgp.as.format(sql,request.query);
  sql = sql.replaceAll("'null'",null);
  db_common_api.queryExecute(sql,response,undefined,request.query.action,undefined,request.isAuthenticated());
  console.log(request.session);
  console.log(request.sessionID);
}
async function fupdateRestrictionMainData (request, response) {
  let fields = [ 'idportfolio', 'restriction_type_id', 'value', 'param']
 db_common_api.fUpdateTableDB ('d_i_restrictions',fields,'id',request, response)
}
module.exports = {
  geRestrictionsData,
  fupdateRestrictionMainData
}