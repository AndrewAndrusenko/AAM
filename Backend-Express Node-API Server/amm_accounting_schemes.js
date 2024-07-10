const db_common_api = require('./db_common_api')
function getAccountingSchemes (request,response) {
  let sql = '';
  switch (request.query.action) {
    case 'getAccessTransactionTypes':
      sql='SELECT tp.id, transaction_type_id,tt.description, tt."xActTypeCode_Ext",tp.role,tt.code2, 0 AS action FROM public."bcTransactionType_Ext_Privileges" tp '+
          'LEFT JOIN public."bcTransactionType_Ext" tt  ON tp.transaction_type_id=tt.id  ORDER BY tp.role, tt."xActTypeCode_Ext";'
    break;
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
  db_common_api.queryExecute(sql,response,undefined,request.query.action,undefined);
}
function updateTransactionTypes (request,response) {
  fields = ['xActTypeCode_Ext', 'description', 'code2', 'manual_edit_forbidden']
  db_common_api.fUpdateTableDB('bcTransactionType_Ext',fields,'id',request,response,[])
}
function updateAccessTransactionTypes (request,response) {
  fields = ['transaction_type_id', 'role']
  db_common_api.fUpdateTableDB('bcTransactionType_Ext_Privileges',fields,'id',request,response,[])
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
  updateSchemeTransaction,
  updateAccessTransactionTypes
}