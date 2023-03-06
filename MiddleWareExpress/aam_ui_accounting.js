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
    case 'GetAccountData':
      query.text ='SELECT '+
        '"accountNo", "accountTypeExt", "Information", "clientId", "currencyCode", "entityTypeCode", "accountId" '+
        'FROM public."bAccounts" WHERE ("accountNo"= $1) ; '
      query.values = [request.query.accountNo]
    break;
    case 'GetAccountDataWholeList':
      query.text ='SELECT '+
      '"accountNo", "accountTypeExt", "Information", "clientId", "currencyCode", "entityTypeCode", "accountId", '+
      'clientname AS d_clientname, dportfolios.portfolioname AS "d_portfolioCode" ' +
      'FROM public."bAccounts" '+
      'LEFT JOIN dclients ON "bAccounts"."clientId" = dclients.idclient ' +
      'LEFT JOIN "bAccountsPortfoliosLink" ON "bAccountsPortfoliosLink"."accountNoId" = "accountId" '+
      'LEFT JOIN dportfolios ON dportfolios.idportfolio = "bAccountsPortfoliosLink"."portfolioId" ; '
    break;
    case 'GetLedgerAccountsDataWholeList' :
      query.text ='SELECT '+
        '"accountTypeID", name, "clientID", "entityTypeCode", "ledgerNo", "currecyCode", '+
        '"ledgerNoCptyCode", "ledgerNoTrade", "externalAccountNo", "ledgerNoId", '+
        '"bcAccountType_Ext"."actCodeShort" ||\': \' || "bcAccountType_Ext"."description" as "d_Account_Type", '+
        '"dclients"."clientname" as "d_Client", "bcAccountType_Ext"."APTypeCode" as "d_APTypeCodeAccount" '+
        'FROM public."bLedger" '+
        'LEFT JOIN "dclients" ON "bLedger"."clientID" = "dclients".idclient ' +
        'LEFT JOIN "bcAccountType_Ext" ON "bcAccountType_Ext"."accountType_Ext" = "bLedger"."accountTypeID" ;'
    break;
    case 'GetAccountsEntriesListAccounting':
      query.text ='SELECT "bAccountTransaction".id AS "t_id", "entryDetails" AS "t_entryDetails", ' + 
      '"bAccountTransaction"."ledgerNoId" AS "t_ledgerNoId", "bAccountTransaction"."accountId" AS "t_accountId", ' +
      '"dataTime" AS "t_dataTime", "extTransactionId" AS "t_extTransactionId", "amountTransaction" AS "t_amountTransaction", '+
      '"XactTypeCode" AS "t_XactTypeCode", "bAccountTransaction"."XactTypeCode_Ext" AS "t_XactTypeCode_Ext" , '+
      '"bcTransactionType_Ext"."description" ||\': \' || "bAccountTransaction"."entryDetails" as "d_entryDetails", ' +
      'CASE "bAccountTransaction"."XactTypeCode" ' +
      'WHEN 1 THEN  "bLedger"."ledgerNo" ' +
      'WHEN 2 THEN "bAccounts"."accountNo" ' +
      'END as "d_Debit",' +
      'CASE "bAccountTransaction"."XactTypeCode" ' +
      'WHEN 2 THEN "bLedger"."ledgerNo" ' +
      'WHEN 1 THEN "bAccounts"."accountNo" ' +
      'END as "d_Credit",' +
      '"ledgerNo" AS "d_ledgerNo", "accountNo" AS "d_accountNo", "bcTransactionType_Ext"."xActTypeCode_Ext" AS "d_xActTypeCodeExtName" ' +
      'FROM "bAccountTransaction" ' +
      'LEFT join "bcTransactionType_Ext" ON "bAccountTransaction"."XactTypeCode_Ext" = "bcTransactionType_Ext".id ' +
      'LEFT JOIN "bAccounts" on "bAccounts"."accountId" = "bAccountTransaction"."accountId" ' +
      'LEFT JOIN "bLedger" ON "bLedger"."ledgerNoId" = "bAccountTransaction"."ledgerNoId"; ' 
    break;
    case 'GetbLastClosedAccountingDate':
      query.text ='SELECT * FROM "bLastClosedAccountingDate";'
    break
    
  }
  console.log('que', query);
  pool.query (query, (err, res) => {if (err) {console.log (err.stack)} else {
    //  console.log('res',res.rows);
    return response.status(200).json((res.rows))}
  })
}
async function fGetMT950Transactions (request,response) {
  const query = {text: ''}
  switch (request.query.Action) {
    case 'GetSWIFTsList':
      query.text = 'SELECT ' + 
      ' id, "msgId", "senderBIC", "DateMsg", "typeMsg", "accountNo", "bLedger"."ledgerNo", "ledgerNoId"'+ 
      ' FROM public."bSWIFTGlobalMsg" ' +
      ' LEFT JOIN public."bLedger" ON "bSWIFTGlobalMsg"."accountNo" = "bLedger"."externalAccountNo" '+
      ' ORDER BY id; '
    break;
    case 'GetMT950Transactions':
      query.text ='SELECT '+
        'id, "msgId", "amountTransaction", "typeTransaction", "valueDate", comment, "entryAllocatedId", "refTransaction", "entriesAllocated"."entriesAmount" '+
        'FROM public."bSWIFTStatement" ' +
        'LEFT JOIN "entriesAllocated" ON "bSWIFTStatement".id = "entriesAllocated"."extTransactionId" '+
        'WHERE ("msgId"= $1) ORDER BY "msgId", id; '
      query.values = [request.query.id]
    break;
  }
  pool.query (query, (err, res) => {if (err) {console.log (err.stack)} else {
    return response.status(200).json((res.rows))}
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
async function fCreateEntryAccountingInsertRow (request, response) {
    data = request.body.data
    fields = Object.keys(data).map(filed => `"${filed}"`).join()
    const query = {
    text: 'INSERT INTO public."bAccountTransaction" ' +
          '(' +  fields + ')' +
          ' VALUES (' + Object.values (data).map(value => `'${value}'`).join() + ');',
    }
    // sql = pgp.as.format(query.text,query.values)
    pool.query (query.text,  (err, res) => {if (err) {
      console.log (err.stack.split("\n", 1).join(""))
      err.detail = err.stack
      return response.send(err)
    } else {
      return response.status(200).json(res.rowCount)}
    })  
}
module.exports = {
  fGetMT950Transactions,
  fGetAccountingData,
  GetEntryScheme,
  fCreateEntryAccountingInsertRow
}