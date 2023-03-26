const config = require ('./db_config');
const Pool = require('pg').Pool;
const pool = new Pool(config.dbConfig);
var pgp = require ('pg-promise')({capSQL:true});
const pg = require('pg');
pg.types.setTypeParser(1114, function(stringValue) {
  return stringValue;  //1114 for time without timezone type
});
async function fGetAccountingData (request,response) {
  let conditions = {}
  const query = {text: '', values:[]}
  switch (request.query.Action) {
    case 'bcTransactionType_Ext':
      query.text = 'SELECT id, TRIM("xActTypeCode_Ext") as "xActTypeCode_Ext", description, code2 FROM public."bcTransactionType_Ext" ORDER BY "xActTypeCode_Ext"; '
    break;
    case 'bcEnityType':
      query.text = 'SELECT "entityType", name, "entityTypeCode" FROM public."bcEnityType"; '
    break;
    case 'bcAccountType_Ext':
      query.text = 'SELECT "accountType_Ext","xActTypeCode",description, "actCodeShort", "APTypeCode" FROM "bcAccountType_Ext";'
    break;
    case 'GetAccountData':
      query.text ='SELECT '+
        '"accountNo", "accountTypeExt", "Information", "clientId", "currencyCode", "entityTypeCode", "accountId" '+
        'FROM public."bAccounts" WHERE ("accountNo"= ${accountNo}) ; '
      // query.values = [request.query.accountNo]
    break;
    case 'GetAccountDataWholeList':
      query.text ='SELECT '+
      '"accountNo", "accountTypeExt", "Information", "clientId", "currencyCode","bAccounts"."entityTypeCode", "accountId", '+
      '"bAccounts"."idportfolio", clientname AS d_clientname, dportfolios.portfolioname AS "d_portfolioCode", ' +
      '"bcAccountType_Ext"."actCodeShort" ||\': \' || "bcAccountType_Ext"."description" as "d_Account_Type", ' +
      '"bcAccountType_Ext"."actCodeShort" as "d_accountType", "bcAccountType_Ext"."description" as d_accTypeDescription, ' +
      '"bcEnityType"."entityTypeCode" as d_entityTypeCode, "bcEnityType"."name" as d_entityTypeDescription '+
      'FROM public."bAccounts" '+
      'LEFT JOIN dclients ON "bAccounts"."clientId" = dclients.idclient ' +
      'LEFT JOIN dportfolios ON dportfolios.idportfolio = "bAccounts"."idportfolio" ' +
      'LEFT JOIN "bcAccountType_Ext" ON "bcAccountType_Ext"."accountType_Ext" = "bAccounts"."accountTypeExt" ' +
      'LEFT JOIN "bcEnityType" ON "bcEnityType"."entityType" = "bAccounts"."entityTypeCode"; '
    break;
    case 'GetLedgerData':
      query.text ='SELECT '+
        '"accountTypeID", name, "clientID", "entityTypeCode", "ledgerNo", "currecyCode", '+
        '"ledgerNoCptyCode", "ledgerNoTrade", "externalAccountNo", "ledgerNoId" '+
        'FROM public."bLedger" WHERE ("ledgerNo"= ${accountNo}) ; '
      // query.values = [request.query.accountNo]
    break;
    case 'GetLedgerAccountsDataWholeList' :
      query.text ='SELECT '+
        '"accountTypeID", name, "clientID", "entityTypeCode", "ledgerNo", "currecyCode", '+
        '"ledgerNoCptyCode", "ledgerNoTrade", "externalAccountNo", "ledgerNoId", '+
        '"bcAccountType_Ext"."actCodeShort" ||\': \' || "bcAccountType_Ext"."description" as "d_Account_Type", '+
        '"dclients"."clientname" as "d_Client", '+ 
        ' "bcAccountType_Ext"."xActTypeCode"  as "d_APTypeCodeAccount" '+
        'FROM public."bLedger" '+
        'LEFT JOIN "dclients" ON "bLedger"."clientID" = "dclients".idclient ' +
        'LEFT JOIN "bcAccountType_Ext" ON "bcAccountType_Ext"."accountType_Ext" = "bLedger"."accountTypeID" ;'
    break;
    case 'GetAccountsEntriesListAccounting':
       conditions = {
        'noAccountLedger':{
          1: ' ("bAccounts"."accountNo" = ANY(${noAccountLedger}) OR "bLedger"."ledgerNo" = ANY(${noAccountLedger})) ',
          2: ' ("bLedger"."ledgerNo" = ANY(${noAccountLedger}) OR "bLedgerDebit"."ledgerNo" = ANY(${noAccountLedger})) '
        },
        'dateRangeStart': {
          1: ' ("dataTime"::date >= ${dateRangeStart}::date )',
          2: ' ("dateTime"::date >= ${dateRangeStart}::date)'
        },
        'dateRangeEnd': {
          1: ' ("dataTime"::date <= ${dateRangeEnd}::date) ',
          2: ' ("dateTime"::date <= ${dateRangeEnd}::date)'
        },
        'entryTypes' : {
          1: ' ("XactTypeCode_Ext" = ANY(array[${entryTypes:raw}]))',
          2: ' ("XactTypeCode_Ext" = ANY(array[${entryTypes:raw}]))  '
        }
      }
      let conditionsAccountLedger =' WHERE'
      let conditionsLedgerToLedger =' WHERE'
      Object.entries(conditions).forEach(([key,value]) => {
      if  (request.query.hasOwnProperty(key)) {
        query.values.push(request.query[key]);
        conditionsAccountLedger +=conditions[key][1] + ' AND ';
        conditionsLedgerToLedger +=conditions[key][2] + ' AND ';
        }
      });

      console.log('param',(request.query));
      console.log('values',(query.values));
      console.log('conditionsAccountLedger',(conditionsAccountLedger.slice(0,-5)));
      console.log('conditionsLedgerToLedger',(conditionsLedgerToLedger.slice(0,-5)));
      query.text ='SELECT \'AL\' AS "d_transactionType","bAccountTransaction".id AS "t_id", "entryDetails" AS "t_entryDetails", ' + 
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
      'LEFT JOIN "bLedger" ON "bLedger"."ledgerNoId" = "bAccountTransaction"."ledgerNoId" ' ;

      query.text +=conditionsAccountLedger.slice(0,-5);
      query.text += ' UNION ' +
      'SELECT \'LL\' AS "d_transactionType", "bLedgerTransactions".id AS "t_id", "entryDetails" AS "t_entryDetails", '+
      '"bLedgerTransactions"."ledgerID_Debit" AS "t_ledgerNoId", "bLedgerTransactions"."ledgerID" AS "t_accountId", '+
      '"dateTime" AS "t_dataTime", "extTransactionId" AS "t_extTransactionId", "amount" AS "t_amountTransaction", '+
      '0 AS "t_XactTypeCode", "bLedgerTransactions"."XactTypeCode_Ext" AS "t_XactTypeCode_Ext" , '+
      '"bcTransactionType_Ext"."description" ||\': \' || "bLedgerTransactions"."entryDetails" as "d_entryDetails", '+
      '"bLedgerDebit"."ledgerNo" AS "d_Debit", "bLedger"."ledgerNo" AS "d_Credit",'+
      '"bLedgerDebit"."ledgerNo" AS "d_ledgerNo", "bLedger"."ledgerNo" AS "d_accountNo", '+
      '"bcTransactionType_Ext"."xActTypeCode_Ext" AS "d_xActTypeCodeExtName" '+
      'FROM "bLedgerTransactions" '+
      'LEFT join "bcTransactionType_Ext" ON "bLedgerTransactions"."XactTypeCode_Ext" = "bcTransactionType_Ext".id '+
      'LEFT JOIN "bLedger"  ON "bLedger"."ledgerNoId" = "bLedgerTransactions"."ledgerID" '+
      'LEFT JOIN "bLedger" AS "bLedgerDebit" ON "bLedgerDebit"."ledgerNoId" = "bLedgerTransactions"."ledgerID_Debit" ';
      query.text += conditionsLedgerToLedger.slice(0,-5);
      query.text +='ORDER BY "t_dataTime" DESC; '
    break;
    case 'GetBalanceSheet':
    break;
    case 'GetbLastClosedAccountingDate':

      query.text ='SELECT "FirstOpenedDate"::date FROM "bLastClosedAccountingDate";'
    break
    case 'GetALLAccountsDataWholeList' :
      query.text ='SELECT '+
      '"accountNo", "accountTypeExt", "Information", "clientId", "currencyCode","bAccounts"."entityTypeCode", "accountId", '+
      'clientname AS d_clientname, dportfolios.portfolioname AS "d_portfolioCode", ' +
      '"bcAccountType_Ext"."actCodeShort" ||\': \' || "bcAccountType_Ext"."description" as "d_Account_Type", ' +
      '"bcEnityType"."name" as d_entityTypeDescription, "bcAccountType_Ext"."xActTypeCode"  as "d_APTypeCodeAccount", '+
      'null AS "ledgerNoCptyCode", null AS"ledgerNoTrade" '+
      'FROM public."bAccounts" '+
      'LEFT JOIN dclients ON "bAccounts"."clientId" = dclients.idclient ' +
      'LEFT JOIN dportfolios ON dportfolios.idportfolio = "bAccounts"."idportfolio" ' +
      'LEFT JOIN "bcAccountType_Ext" ON "bcAccountType_Ext"."accountType_Ext" = "bAccounts"."accountTypeExt" ' +
      'LEFT JOIN "bcEnityType" ON "bcEnityType"."entityType" = "bAccounts"."entityTypeCode" ' +
      ' UNION '+
      ' SELECT '+
      '"ledgerNo", "accountTypeID", "bLedger".name, "clientID", "currecyCode", "bLedger"."entityTypeCode", "ledgerNoId", '+
      '"clientname" as "d_Client","externalAccountNo",   '+
      '"bcAccountType_Ext"."actCodeShort" ||\': \' || "bcAccountType_Ext"."description" as "d_Account_Type", '+
      '"bcEnityType"."name" as d_entityTypeDescription,  '+ 
      '"bcAccountType_Ext"."xActTypeCode"  as "d_APTypeCodeAccount", "ledgerNoCptyCode", "ledgerNoTrade"  '+
      'FROM public."bLedger" '+
      'LEFT JOIN "dclients" ON "bLedger"."clientID" = "dclients".idclient ' +
      'LEFT JOIN "bcAccountType_Ext" ON "bcAccountType_Ext"."accountType_Ext" = "bLedger"."accountTypeID" '+
      'LEFT JOIN "bcEnityType" ON "bcEnityType"."entityType" = "bLedger"."entityTypeCode"  ' +
      'ORDER BY 1;'
    break;
    case 'GetALLClosedBalances' :
      conditions = {
        'noAccountLedger':{
          1: ' ("accountNo" = ANY(${noAccountLedger})) ',
        },
        'dateRangeStart': {
          1: ' ("dateBalance"::date >= ${dateRangeStart}::date )',
        },
        'dateRangeEnd': {
          1: ' ("dateBalance"::date <= ${dateRangeEnd}::date) ',
        }
        /* 'entryTypes' : {
          1: ' ("XactTypeCode_Ext" = ANY(array[${entryTypes:raw}]))',
        }
 */      }
      let conditionsBalance =' WHERE'
      Object.entries(conditions).forEach(([key,value]) => {
      if  (request.query.hasOwnProperty(key)) {
        query.values.push(request.query[key]);
        conditionsBalance +=conditions[key][1] + ' AND ';
        }
      });


      query.text ='SELECT '+
      ' "accountNo", "accountId", "accountType", "datePreviousBalance" ,"dateBalance" , "openingBalance", "totalCredit", ' + 
      ' "totalDebit", "OutGoingBalance", "checkClosing" ' +
      ' FROM f_s_balancesheet_all() '+
      ' UNION '+
      'SELECT '+
      '"accountNo", "accountId", \'Account\', null ,"dataTime" , "corrOpeningBalance", "totalCredit", '+
      '"totalDebit",  "corrOpeningBalance" + "signedTurnOver" AS "OutGoingBalance", 0 '+
      'from f_bcurrentturnoversandbalncesnotclosed(\'2023-02-21\') ';
      query.text += conditionsBalance.slice(0,-5) + ';';

    break;
  }
  sql = pgp.as.format(query.text,request.query)
   console.log('sql', sql);
   pool.query (sql,  (err, res) => 
   {if (err) {
    console.log (err.stack.split("\n", 1).join(""))
    err.detail = err.stack
    return response.send(err)
    } else {
      console.log('validator', res.rows[0]);
      return response.status(200).json(res.rows)
    }
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
async function fcreateAccountAccounting (request, response) {
  paramArr = request.body.data
  console.log('data',paramArr);
  const query = {
  text: 'INSERT INTO public."bAccounts" ' +
        ' ("accountNo", "accountTypeExt", "Information", "clientId", "currencyCode", "entityTypeCode", "idportfolio") ' +
        ' VALUES '+
        '(${accountNo}, ${accountTypeExt}, ${Information}, ${clientId}, ${currencyCode}, ${entityTypeCode}, ${idportfolio});',
    values: paramArr
  }
  sql = pgp.as.format(query.text,query.values)
  console.log('sql', sql);
  pool.query (sql,  (err, res) => {if (err) {
    console.log (err.stack.split("\n", 1).join(""))
    err.detail = err.stack
    return response.send(err)
  } else {
    return response.status(200).json(res.rowCount)}
  })  
}
async function fdeleteAccountAccounting (request, response) {
  const query = {text: 'DELETE FROM public."bAccounts" WHERE "accountId"=${id};', values: request.body}
  sql = pgp.as.format(query.text,query.values)
  console.log('sql', sql);
  
  pool.query (sql,  (err, res) => {if (err) { return response.send(err)} else { return response.status(200).json(res.rowCount) }
  }) 
}
async function fupdateAccountAccounting (request, response) {
  paramArr = request.body.data
  const query = {
  text: 'UPDATE public."bAccounts" ' +
	'SET  ' +
   '"accountNo"=${accountNo}, ' +
   '"accountTypeExt"=${accountTypeExt}, '+
   '"Information"=${Information}, '+
   '"clientId"=${clientId}, '+
   '"currencyCode"=${currencyCode}, '+
   '"entityTypeCode"=${entityTypeCode}, '+
   '"idportfolio"=${idportfolio} '+
	 'WHERE "accountId"=${accountId};',
    values: paramArr
  } 
  sql = pgp.as.format(query.text,query.values)
   pool.query (sql,  (err, res) => {if (err) {
    console.log (err.stack.split("\n", 1).join(""))
    err.detail = err.stack
    return response.send(err)
  } else {
    return response.status(200).json(res.rowCount)}
  })   
}

async function fcreateLedgerAccountAccounting (request, response) {
  paramArr = request.body.data
  console.log('data',paramArr);
  const query = {
  text: 'INSERT INTO public."bLedger" ' +
  ' ("accountTypeID", "name", "clientID", "entityTypeCode", "ledgerNo", "currecyCode", "ledgerNoCptyCode", "ledgerNoTrade", "externalAccountNo") ' +
  ' VALUES '+
  '(${accountTypeID}, ${name}, ${clientID}, ${entityTypeCode}, ${ledgerNo}, ${currecyCode}, ${ledgerNoCptyCode}, ${ledgerNoTrade}, ${externalAccountNo});',
    values: paramArr
  }
	
  sql = pgp.as.format(query.text,query.values)
  console.log('sql', sql);
  pool.query (sql,  (err, res) => {if (err) {
    console.log (err.stack.split("\n", 1).join(""))
    err.detail = err.stack
    return response.send(err)
  } else {
    return response.status(200).json(res.rowCount)}
  })  
}
async function fdeleteLedgerAccountAccounting (request, response) {
  const query = {text: 'DELETE FROM public."bLedger" WHERE "ledgerNoId"=${id};', values: request.body}
  sql = pgp.as.format(query.text,query.values)
  console.log('sql', sql);
  
  pool.query (sql,  (err, res) => {if (err) { return response.send(err)} else { return response.status(200).json(res.rowCount) }
  }) 
}
async function fupdateLedgerAccountAccounting (request, response) {
  paramArr = request.body.data
  const query = {
  text: 'UPDATE public."bLedger" ' +
	'SET  ' +
   '"accountTypeID"=${accountTypeID}, ' +
   '"name"=${name}, '+
   '"clientID"=${clientID}, '+
   '"entityTypeCode"=${entityTypeCode}, '+
   '"ledgerNo"=${ledgerNo}, '+
   '"currecyCode"=${currecyCode}, '+
   '"ledgerNoCptyCode"=${ledgerNoCptyCode}, '+
   '"ledgerNoTrade"=${ledgerNoTrade}, '+
   '"externalAccountNo"=${externalAccountNo} '+
	 'WHERE "ledgerNoId"=${ledgerNoId};',
    values: paramArr
  } 

  sql = pgp.as.format(query.text,query.values)
   pool.query (sql,  (err, res) => {if (err) {
    console.log (err.stack.split("\n", 1).join(""))
    err.detail = err.stack
    return response.send(err)
  } else {
    return response.status(200).json(res.rowCount)}
  })   
}

async function fcreateEntryAccounting (request, response) {
  paramArr = request.body.data
  console.log('data',paramArr);
  const query = {
  text: 'INSERT INTO public."bAccountTransaction" ' +
  ' ("ledgerNoId", "dataTime", "XactTypeCode", "XactTypeCode_Ext", "accountId",  "amountTransaction", "entryDetails", "extTransactionId") ' +
  ' VALUES '+
  '(${t_ledgerNoId}, ${t_dataTime}, ${t_XactTypeCode}, ${t_XactTypeCode_Ext}, ${t_accountId}, ${t_amountTransaction}, ${t_entryDetails},  ${t_extTransactionId});',
    values: paramArr
  }
  sql = pgp.as.format(query.text,query.values)
  console.log('sql', sql);
  pool.query (sql,  (err, res) => {if (err) {
    console.log (err.stack.split("\n", 1).join(""))
    err.detail = err.stack
    return response.send(err)
  } else {
    return response.status(200).json(res.rowCount)}
  })  
}
async function fdeleteEntryrAccountAccounting (request, response) {
  const query = {text: 'DELETE FROM public."bAccountTransaction" WHERE "id"=${id};', values: request.body}
  sql = pgp.as.format(query.text,query.values)
  console.log('sql', sql);
  
  pool.query (sql,  (err, res) => {if (err) { return response.send(err)} else { return response.status(200).json(res.rowCount) }
  }) 
}
async function fupdateEntryAccountAccounting (request, response) {
  paramArr = request.body.data
  console.log('param', paramArr, paramArr.t_dataTime.value);
  const query = {
  text: 'UPDATE public."bAccountTransaction" ' +
	'SET  ' +
   '"ledgerNoId"=${t_ledgerNoId}, ' +
   '"dataTime"=${t_dataTime}::date, '+
   '"XactTypeCode_Ext"=${t_XactTypeCode_Ext}, '+
   '"XactTypeCode"=${t_XactTypeCode}, '+
   '"accountId"=${t_accountId}, '+
   '"amountTransaction"=${t_amountTransaction}, '+
   '"entryDetails"=${t_entryDetails}, '+
   '"extTransactionId"=${t_extTransactionId} '+
	 'WHERE id = ${t_id};',
    values: paramArr
  } 
  sql = pgp.as.format(query.text,query.values)
   pool.query (sql,  (err, res) => {if (err) {
    console.log (err.stack.split("\n", 1).join(""))
    err.detail = err.stack
    return response.send(err)
  } else {
    return response.status(200).json(res.rowCount)}
  })   
}

async function fcreateLLEntryAccounting (request, response) {
  paramArr = request.body.data
  console.log('data',paramArr);
  const query = {
  text: 'INSERT INTO public."bLedgerTransactions" ' +
  ' ("ledgerID_Debit", "dateTime",  "XactTypeCode_Ext", "ledgerID",  "amount", "entryDetails", "extTransactionId") ' +
  ' VALUES '+
  '(${t_ledgerNoId}, ${t_dataTime}::date,  ${t_XactTypeCode_Ext}, ${t_accountId}, ${t_amountTransaction}, ${t_entryDetails},  ${t_extTransactionId});',
    values: paramArr
  } 
  sql = pgp.as.format(query.text,query.values)
  console.log('sql', sql);
  pool.query (sql,  (err, res) => {if (err) {
    console.log (err.stack.split("\n", 1).join(""))
    err.detail = err.stack
    return response.send(err)
  } else {
    return response.status(200).json(res.rowCount)}
  })  
}
async function fdeleteLLEntryrAccountAccounting (request, response) {
  const query = {text: 'DELETE FROM public."bLedgerTransactions" WHERE "id"=${id};', values: request.body}
  sql = pgp.as.format(query.text,query.values)
  console.log('sql', sql);
  
  pool.query (sql,  (err, res) => {if (err) { return response.send(err)} else { return response.status(200).json(res.rowCount) }
  }) 
}
async function fupdateLLEntryAccountAccounting (request, response) {
  paramArr = request.body.data
  console.log('param', paramArr, paramArr.t_dataTime.value);
  const query = {
  text: 'UPDATE public."bLedgerTransactions" ' +
	'SET  ' +
   '"ledgerID_Debit"=${t_ledgerNoId}, ' +
   '"dateTime"=${t_dataTime}::date, '+
   '"XactTypeCode_Ext"=${t_XactTypeCode_Ext}, '+
   '"ledgerID"=${t_accountId}, '+
   '"amount"=${t_amountTransaction}, '+
   '"entryDetails"=${t_entryDetails}, '+
   '"extTransactionId"=${t_extTransactionId} '+
	 'WHERE id = ${t_id};',
    values: paramArr
  } 

  sql = pgp.as.format(query.text,query.values)
   pool.query (sql,  (err, res) => {if (err) {
    console.log (err.stack.split("\n", 1).join(""))
    err.detail = err.stack
    return response.send(err)
  } else {
    return response.status(200).json(res.rowCount)}
  })   
}
async function faccountingOverdraftAccountCheck (request, response) {
  paramArr = request.query
  console.log('param', paramArr);
  const query = {
    text: 'SELECT "accountId", "openingBalance", CAST ("closingBalance" AS NUMERIC) AS "closingBalance", "closingBalance" AS "EndBalance"'+
    'FROM f_checkoverdraftbyaccountandbydate'+
    '(${transactionDate}, ${accountId}, ${xactTypeCode}, ${transactionAmount}, ${id}, ${FirstOpenedAccountingDate}) ', 
    values: paramArr
  } 
  sql = pgp.as.format(query.text,query.values)
  console.log('sql', sql);
   pool.query (sql,  (err, res) => {if (err) {
    console.log (err.stack.split("\n", 1).join(""))
    err.detail = err.stack
    return response.send(err)
  } else {
    console.log('validator', res.rows[0]);
    return response.status(200).json(res.rows)}
  })   
}

async function faccountingOverdraftLedgerAccountCheck (request, response) {
  paramArr = request.query
  console.log('param', paramArr);
  const query = {
    text: 'SELECT * , '+
    'CAST(("openingBalance" +	"accountTransaction" + "CrSignAmount" + "DbSignAmount" + "signedTransactionAmount") AS numeric) as "closingBalance" '+
    'FROM f_CheckOverdraftByLedgerAndByDate'+
    '(${transactionDate}, ${accountId}, ${xactTypeCode}, ${transactionAmount}, ${id}, ${FirstOpenedAccountingDate} )', 
    values: paramArr
  } 
  sql = pgp.as.format(query.text,query.values)
  console.log('tLedge', sql);
   pool.query (sql,  (err, res) => {if (err) {
    console.log (err.stack.split("\n", 1).join(""))
    err.detail = err.stack
    return response.send(err)
  } else {
    console.log('validator', res.rows[0]);
    return response.status(200).json(res.rows)}
  })   
}
module.exports = {
  fGetMT950Transactions,
  fGetAccountingData,
  GetEntryScheme,
  fCreateEntryAccountingInsertRow,
  
  fupdateAccountAccounting,
  fdeleteAccountAccounting,
  fcreateAccountAccounting,
  
  fupdateLedgerAccountAccounting,
  fdeleteLedgerAccountAccounting,
  fcreateLedgerAccountAccounting,
  
  fcreateLLEntryAccounting,
  fdeleteLLEntryrAccountAccounting,
  fupdateLLEntryAccountAccounting,
  
  fcreateEntryAccounting,
  fdeleteEntryrAccountAccounting,
  fupdateEntryAccountAccounting,

  faccountingOverdraftAccountCheck,
  faccountingOverdraftLedgerAccountCheck
}