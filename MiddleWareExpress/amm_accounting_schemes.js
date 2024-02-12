const db_common_api = require('./db_common_api')
var pgp = require('pg-promise')({capSQL:true});
function getAccountingSchemes (request,response) {
  let sql = '';
  switch (request.query.action) {
    case 'getTransactionTypes':
      sql='SELECT id, "xActTypeCode_Ext", description, code2, manual_edit_forbidden,0 as action  FROM public."bcTransactionType_Ext";'
      break;
  }
  db_common_api.queryExecute(sql,response,undefined,request.query.action);
}
function updateTransactionTypes (request,response) {
  fields = ['xActTypeCode_Ext', 'description', 'code2', 'manual_edit_forbidden']
  db_common_api.fUpdateTableDB('bcTransactionType_Ext',fields,'id',request,response,[])
}
module.exports = {
  getAccountingSchemes,
  updateTransactionTypes
}