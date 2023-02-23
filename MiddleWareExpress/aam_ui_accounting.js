const config = require ('./db_config');
const Pool = require('pg').Pool;
const pool = new Pool(config.dbConfig);
var pgp = require ('pg-promise')({capSQL:true});
const pg = require('pg');
pg.types.setTypeParser(1114, function(stringValue) {
  return stringValue;  //1114 for time without timezone type
});
async function fGetMT950Transactions (request,response) {
  const query = {text: ''}
  console.log('request.query',request.query);
  switch (request.query.Action) {
    case 'GetSWIFTsList':
      query.text = 'SELECT id, "msgId", "senderBIC", "DateMsg", "typeMsg" FROM public."bGlobalMsgSwift" ORDER BY id; '
    break;
    case 'GetMT950Transactions':
      query.text ='SELECT id, "msgId", "amountTransaction", "typeTransaction", "valueDate", comment, "entryAllocatedId" '+
                  'FROM public."bStatementSWIFT" WHERE ("msgId"= $1) ORDER BY "msgId", id; '
      query.values = [request.query.id]
    break;
    default:
      query.text += ';'
    break;
  }
  console.log('query',query);
  pool.query (query, (err, res) => {if (err) {console.log (err.stack)} else {
    console.log('res',res.rows);
    return response.status(200).json((res.rows))}
  })
}
module.exports = {
  fGetMT950Transactions
}