const db_common_api = require('./db_common_api')
const server = require('./server')
var pgp = require('pg-promise')({capSQL:true});
function getAccountingSchemes (request,response) {
  let sql = '';
  switch (request.query.action) {
    case 'getTransactionTypes':
      sql='SELECT id, "xActTypeCode_Ext", description, code2, manual_edit_forbidden,0 as action  FROM public."bcTransactionType_Ext";'
    break;
    case 'getSchemeLedgerTransaction':
      sql='SELECT * FROM public."v_bcSchemeLedgerTransaction";'
    break;
    case 'getSchemeAccountTransaction':
      sql='SELECT * FROM public."v_bcSchemeAccountTransaction";'
    break;
    case 'getSchemesProcesses':
      sql='SELECT * FROM public."bcSchemesProcesses";'
    break;
    case 'getSchemesParameters':
      sql='SELECT * FROM public."bcSchemesParameters";'
      break;
      default:
      sql='SELECT * FROM public."bcSchemesParameters";'
    break;
  }
  db_common_api.queryExecute(sql,response,undefined,request.query.action,undefined,request);
}
function updateTransactionTypes (request,response) {
  fields = ['xActTypeCode_Ext', 'description', 'code2', 'manual_edit_forbidden']
  db_common_api.fUpdateTableDB('bcTransactionType_Ext',fields,'id',request,response,[])
}
function updateSchemeTransaction (request,response) {
  fields = request.body.table==='bcSchemeLedgerTransaction' ?
   ['ledgerID', 'dateTime', 'ledgerID_Debit', 'amount', 'entryDetails', 'cSchemeGroupId',  'XactTypeCode', 'XactTypeCode_Ext', 'extTransactionId', 'idtrade']
   : ['ledgerNoId', 'dataTime', 'accountId','amountTransaction', 'entryDetails', 'cSchemeGroupId',  'XactTypeCode', 'XactTypeCode_Ext', 'extTransactionId', 'idtrade']
   let table = ['bcSchemeLedgerTransaction','bcSchemeAccountTransaction'].includes(request.body.table)? request.body.table : null;
  db_common_api.fUpdateTableDB(table,fields,'id',request,response,[])
}

module.exports = {
  getAccountingSchemes,
  updateTransactionTypes,
  updateSchemeTransaction
}