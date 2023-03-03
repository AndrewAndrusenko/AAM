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
    case 'GetAccountData':
      query.text ='SELECT '+
                  '"accountNo", "accountTypeExt", "Information", "clientId", "currencyCode", "entityTypeCode", "accountId" '+
                  'FROM public."bAccounts" WHERE ("accountNo"= $1) ; '
      query.values = [request.query.accountNo]
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
      ' id, "msgId", "senderBIC", "DateMsg", "typeMsg", "accountNo", "bLedger"."ledgerNo", "ledgerNoId"'+ 
      ' FROM public."bGlobalMsgSwift" ' +
      ' LEFT JOIN public."bLedger" ON "bGlobalMsgSwift"."accountNo" = "bLedger"."externalAccountNo" '+
      ' ORDER BY id; '
    break;
    case 'GetMT950Transactions':
      query.text ='SELECT '+
        'id, "msgId", "amountTransaction", "typeTransaction", "valueDate", comment, "entryAllocatedId", "refTransaction" '+
        'FROM public."bStatementSWIFT" WHERE ("msgId"= $1) ORDER BY "msgId", id; '
      query.values = [request.query.id]
    break;
  }
  pool.query (query, (err, res) => {if (err) {console.log (err.stack)} else {return response.status(200).json((res.rows))}
  })
}


async function GetEntryScheme (request, response) {
  console.log('request.GetEntryScheme', request.query);

  const query = {
    text:'SELECT '+
    '"ledgerNoId", "dataTime", "XactTypeCode", ' +
    '"XactTypeCode_Ext" , "accountId", "amountTransaction", '+
    '"entryDetails", "extTransactionId" '+
    'FROM public."bcSchemeAccountTransaction" '+
    'WHERE '+
    '("cxActTypeCode_Ext" = ${cxActTypeCode_Ext} AND "cxActTypeCode" = ${cxActTypeCode} AND "cLedgerType" = ${cLedgerType});'
  }

  sql = pgp.as.format(query.text,request.query)
  console.log('sql', sql);
  pool.query (sql,  (err, res) => {if (err) {
    console.log (err.stack.split("\n", 1).join(""))
    err.detail = err.stack
    return response.send(err)
  } else {
    if (res.rows.length !== 0) {
      entryDraftData = JSON.parse (pgp.as.format (JSON.stringify(res.rows[0]), request.query))
      console.log('parse',[entryDraftData] );

      sql = 'SELECT ' + 
      '"bLedger"."ledgerNo", "bAccounts"."accountNo", "bcTransactionType_Ext"."xActTypeCode_Ext", "bcTransactionType_DE"."name", '+ 'json_populate_recordset.* ' +
      'FROM json_populate_recordset(null::public."bAccountTransaction",\'[' + [JSON.stringify(entryDraftData)] +']\') ' +
      'LEFT JOIN "bcTransactionType_Ext" ON "bcTransactionType_Ext".id = json_populate_recordset."XactTypeCode_Ext" ' +
      'LEFT JOIN "bcTransactionType_DE" ON "bcTransactionType_DE"."xActTypeCode" = json_populate_recordset."XactTypeCode" ' +
      'LEFT JOIN "bLedger" ON "bLedger"."ledgerNoId" = json_populate_recordset."ledgerNoId"	' +
      'LEFT JOIN "bAccounts" ON "bAccounts"."accountId" = json_populate_recordset."accountId";	' 	
      console.log('sql',sql); 
      pool.query (sql,  (err, res) => {if (err) {
        console.log (err.stack.split("\n", 1).join(""))
        err.detail = err.stack
        return response.send(err)
      } else {
        console.log('res', res.rows[0]);
        return response.status(200).json((res.rows[0]))

      }})
      
    }
  }
  })
}

module.exports = {
  fGetMT950Transactions,
  fGetAccountingData,
  GetEntryScheme,
}