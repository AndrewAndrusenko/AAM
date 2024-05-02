const config = require ('./db_config');
const Pool = require('pg').Pool;
const poolSuper = new Pool(config.dbConfig);
var pool;
const pool_middle_officer = new Pool(config.dbConfig_aam_middile_officer);
const pool_back_officer = new Pool(config.dbConfig_aam_back_officer);
const pool_portfolio_manager = new Pool(config.dbConfig_aam_portfolio_manager);
const pool_accountant = new Pool(config.dbConfig_aam_accountant);
const pool_trader = new Pool(config.dbConfig_aam_trader);
var pgp = require ('pg-promise')({capSQL:true});
const pg = require('pg');
async function checkInternetConnection () {
let isConnected = !!await require('dns').promises.resolve('google.com').catch(()=>{});
return isConnected;
}
async function queryExecute (sql, response, responseType, sqlID, SendResponse=true) {
  let accRole;
  accRole = response? response.req.user.accessrole:'super'
  switch (accRole) {
    case 'testRole':
      pool = poolSuper;
      break;
    case 'portfolioManager':
      pool = pool_portfolio_manager;
    break;
    case 'middleOffice':
      pool = pool_middle_officer;
    break;
    case 'backOffice':
      pool = pool_back_officer;
    break;
    case 'trader':
      pool = pool_trader;
    break;
    case 'AccountantOfficer':
      pool = pool_accountant;
    break;
    default:
      console.log('ERROR => '+sqlID+' There is no response object in params');
    break;
  }
  return new Promise ((resolve) => {
    pool.query (sql,  (err, res) => {
      if (err) {
        console.log (sqlID,err.stack.split("\n", 1).join(""))
        err.detail = err.stack
        resolve (response? response.status(409).send(err):err)
      } else {
        let rows = [];
        res.length? res.map(el => rows.push(...el.rows) ): rows = res.rows;
        result = responseType === 'rowCount'?  res.rowCount : rows;
        console.log(
          new Date().toLocaleTimeString().slice(0,-3) +':'+ new Date().getMilliseconds(), sqlID,'Rows:'+  responseType === 'rowCount'?  res.rowCount :rows.length)
        resolve (response&&SendResponse? response.status(200).json(result):result)
      }
    })
  })
} 
async function fUpdateTableDB (table, fields,idfieldName, request, response,dates) {
  return new Promise ((resolve) => {
    dates = !dates? []:dates; 
    let fieldsWithQuetes =  fields.join('","')
    let values = fields.map(el=>dates.includes(el)? '${'+el+'}::timestamptz':'${'+el+'}');
    let updatePairs = fields.map(el=> dates.includes(el)? '"'+el+'"'+'=${'+el+'}::timestamptz': '"'+el+'"'+'=${'+el+'}');
    switch (request.body.action) {
      case 'Create':
        sqlText = 'INSERT INTO public."'+ table +'" ("'+ fieldsWithQuetes +'") VALUES ('+ values + ') RETURNING *;'
      break;
      case 'Edit':
        sqlText = 'UPDATE public."'+ table +'" SET ' + updatePairs + ' WHERE "'+ idfieldName +'"=${'+ idfieldName +'} RETURNING *'
      break;
      case 'Delete':
        sqlText = 'DELETE FROM public."'+ table +'" WHERE "'+ idfieldName;
        sqlText += typeof(request.body.data[idfieldName]) ==='object'? '"=ANY(${'+ idfieldName +'}) RETURNING *;' : '"=${'+ idfieldName +'} RETURNING *;' 
      break;
      }
      sql = pgp.as.format(sqlText,request.body.data);
      // console.log(sql);
    resolve(queryExecute (sql, response,undefined,'fUpdateTableDB '+request.body.action+' '+table,table))
  })
}
function getTransformArrayParam(request,paramsList) {
  paramsList.forEach(key=>{
    if (typeof(request.query[key])==='object') {
      request.query[key] = request.query[key].map(el=>Number(el))} 
    else{
      request.query[key] = request.query[key] !=='null'?  [Number(request.query[key])]:'null';
    } 
  })
  return request
}
function sqlReplace(sql) {
  sql = sql.replaceAll("'null'",null);
  sql = sql.replaceAll("array[0,0]",null);
  sql = sql.replaceAll(",'ClearAll'",',null');
  sql = sql.replaceAll("'clearall'",null);
  sql = sql.replaceAll("'null'::numrange",null);
  sql = sql.replaceAll("null::numrange",null);
  sql = sql.replaceAll("null::daterange",null);
  return sql;
}

module.exports = {
  queryExecute,
  fUpdateTableDB,
  getTransformArrayParam,
  checkInternetConnection,
  sqlReplace
}