const config = require ('./db_config');
const Pool = require('pg').Pool;
const pool = new Pool(config.dbConfig);
var pgp = require ('pg-promise')({capSQL:true});
const pg = require('pg');
pg.types.setTypeParser(1114, function(stringValue) {
  return stringValue;  //1114 for time without timezone type
});
async function fGetAccountingData (request,response) {
  const query = {text: ''}
  switch (request.query.Action) {
    case 'bcTransactionType_Ext':
      query.text = 'SELECT id, TRIM("xActTypeCode_Ext") as "xActTypeCode_Ext", description, code2 FROM public."bcTransactionType_Ext" ORDER BY "xActTypeCode_Ext"; '
    break;
    case 'GetMT950Transactions':
      query.text ='SELECT id, "msgId", "amountTransaction", "typeTransaction", "valueDate", comment, "entryAllocatedId" '+
                  'FROM public."bStatementSWIFT" WHERE ("msgId"= $1) ORDER BY "msgId", id; '
      query.values = [request.query.id]
    break;
  }
  pool.query (query, (err, res) => {if (err) {console.log (err.stack)} else {
    return response.status(200).json((res.rows))}
  })
}


async function fGetMT950Transactions (request,response) {
  const query = {text: ''}
  switch (request.query.Action) {
    case 'GetSWIFTsList':
      query.text = 'SELECT ' + 
      ' id, "msgId", "senderBIC", "DateMsg", "typeMsg", "accountNo", "bLedger"."ledgerNo" '+ 
      ' FROM public."bGlobalMsgSwift" ' +
      ' LEFT JOIN public."bLedger" ON "bGlobalMsgSwift"."accountNo" = "bLedger"."externalAccountNo" '+
      ' ORDER BY id; '
    break;
    case 'GetMT950Transactions':
      query.text ='SELECT id, "msgId", "amountTransaction", "typeTransaction", "valueDate", comment, "entryAllocatedId" '+
                  'FROM public."bStatementSWIFT" WHERE ("msgId"= $1) ORDER BY "msgId", id; '
      query.values = [request.query.id]
    break;
  }
  console.log('query', query);
  pool.query (query, (err, res) => {if (err) {console.log (err.stack)} else {return response.status(200).json((res.rows))}
  })
}
module.exports = {
  fGetMT950Transactions,
  fGetAccountingData
}