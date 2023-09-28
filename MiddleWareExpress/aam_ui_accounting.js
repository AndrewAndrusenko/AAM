const { response } = require('express');
const  db_common_api = require ('./db_common_api')
const config = require ('./db_config');
const Pool = require('pg').Pool;
const pool = new Pool(config.dbConfig);
var pgp = require ('pg-promise')({capSQL:true});
const pg = require('pg');
pg.types.setTypeParser(1114, function(stringValue) {
  return stringValue;  
});
async function fUpdateAccountAccounting (request, response) {
  let fields =  ['accountNo','accountTypeExt','Information','clientId','currencyCode','entityTypeCode','idportfolio','secid']
  db_common_api.fUpdateTableDB ('bAccounts',fields,'accountId',request, response)
}
async function fUpdateLedgerAccountAccounting (request, response) {
  let fields =  ['accountTypeID', 'name', 'clientID', 'entityTypeCode', 'ledgerNo', 'currecyCode', 'ledgerNoCptyCode', 'ledgerNoTrade', 'externalAccountNo']
  db_common_api.fUpdateTableDB ('bLedger',fields,'ledgerNoId',request, response)
}
async function fCreateDepoSubAccounts (request,response) {
  let sql = "SELECT * FROM f_create_depo_accounts (ARRAY[${portfolioIds}],${secid});";
  sql = pgp.as.format(sql,request.body);
  db_common_api.queryExecute(sql,response,undefined,'fCreateDepoSubAccounts');
}
async function fdeleteFIFOtransactions (request,response) {
  let sql = 'select * from f_fifo_delete_trades_from_fifo_calc(ARRAY[${idtrades}])';
  sql = pgp.as.format(sql,request.body.params);
  db_common_api.queryExecute(sql,response,undefined,'fdeleteFIFOtransactions');
}
async function fcreateFIFOtransactions (request,response) {
  let sql = "CALL p_fifo_create_out_transactions (${idportfolio},${secid},${qty_to_sell},${sell_price},${id_sell_trade},${tr_type});";
/*   let sql = '';
  if (request.body.params.tradeType==='BUY') {
    sql = "SELECT * FROM f_fifo_create_buy_transactions (ARRAY[${idtrades}]);";
  } else {
  } */
  sql = pgp.as.format(sql,request.body.params);
  db_common_api.queryExecute(sql,response,undefined,'p_fifo_create_out_transactions');
}
async function fUpdateLLEntryAccounting (request, response) {
  let fields =  ['ledgerID_Debit', 'dateTime',  'XactTypeCode_Ext', 'ledgerID',  'amount', 'entryDetails', 'extTransactionId','idtrade']
  db_common_api.fUpdateTableDB ('bLedgerTransactions',fields,'id',request, response)
}
async function fUpdateEntryAccountAccounting (request, response) {
  let fields =  ['ledgerNoId', 'dataTime', 'XactTypeCode', 'XactTypeCode_Ext', 'accountId',  'amountTransaction', 'entryDetails', 'extTransactionId','idtrade']
  db_common_api.fUpdateTableDB ('bAccountTransaction',fields,'id',request, response)
}
async function fGetAccountingData (request,response) {
  let conditions = {}
  const query = {text: ''}
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
        '"accountNo", "accountTypeExt", "Information", "clientId", "currencyCode", "entityTypeCode", "accountId", '+
        'clientname AS d_clientname, "bAccounts"."idportfolio", dportfolios.portfolioname AS "d_portfolioCode",secid '+
        'FROM public."bAccounts" '+
        'LEFT JOIN dclients ON "bAccounts"."clientId" = dclients.idclient ' +
        'LEFT JOIN dportfolios ON dportfolios.idportfolio = "bAccounts"."idportfolio" ' +
        'WHERE ("accountNo"= ${accountNo}) ; '
    break;
    case 'GetAccountDataWholeList':
      query.text ='SELECT '+
      '"accountNo", "accountTypeExt", "Information", "clientId", "currencyCode","bAccounts"."entityTypeCode", "accountId", secid,'+
      '"bAccounts"."idportfolio", clientname AS d_clientname, dportfolios.portfolioname AS "d_portfolioCode", ' +
      '"bcAccountType_Ext"."actCodeShort" ||\': \' || "bcAccountType_Ext"."description" as "d_Account_Type", ' +
      '"bcAccountType_Ext"."actCodeShort" as "d_accountType", "bcAccountType_Ext"."description" as d_accTypeDescription, ' +
      '"bcEnityType"."entityTypeCode" as d_entityTypeCode, "bcEnityType"."name" as d_entityTypeDescription,"bcAccountType_Ext"."xActTypeCode"  as "d_APTypeCodeAccount", 0 as action '+
      'FROM public."bAccounts" '+
      'LEFT JOIN dclients ON "bAccounts"."clientId" = dclients.idclient ' +
      'LEFT JOIN dportfolios ON dportfolios.idportfolio = "bAccounts"."idportfolio" ' +
      'LEFT JOIN "bcAccountType_Ext" ON "bcAccountType_Ext"."accountType_Ext" = "bAccounts"."accountTypeExt" ' +
      'LEFT JOIN "bcEnityType" ON "bcEnityType"."entityType" = "bAccounts"."entityTypeCode"; '
    break;
    case 'GetLedgerData':
      query.text ='SELECT '+
        '"accountTypeID", name, "clientID", "entityTypeCode", "ledgerNo", "currecyCode", '+
        '"ledgerNoCptyCode", "ledgerNoTrade", "externalAccountNo", "ledgerNoId", '+
        '"dclients"."clientname" as "d_Client" '+
        'FROM public."bLedger" '+
        'LEFT JOIN "dclients" ON "bLedger"."clientID" = "dclients".idclient ' +
        'WHERE ("ledgerNo"= ${accountNo}) ; '
    break;
    case 'GetLedgerAccountsDataWholeList' :
      query.text ='SELECT '+
        '"accountTypeID", name, "clientID", "entityTypeCode", "ledgerNo", "currecyCode", '+
        '"ledgerNoCptyCode", "ledgerNoTrade", "externalAccountNo", "ledgerNoId", '+
        '"bcAccountType_Ext"."actCodeShort" ||\': \' || "bcAccountType_Ext"."description" as "d_Account_Type", '+
        '"dclients"."clientname" as "d_Client", '+ 
        ' "bcAccountType_Ext"."xActTypeCode"  as "d_APTypeCodeAccount", 0 as action '+
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
        },
        'extTransactionId' : {
          1: ' ("extTransactionId" = ${extTransactionId:raw})',
          2: ' ("extTransactionId" = ${extTransactionId:raw}) '
        },
        'idtrade' : {
          1: ' ("idtrade" = ${idtrade:raw})',
          2: ' ("idtrade" = ${idtrade:raw}) '
        },
      }
      let conditionsAccountLedger =' WHERE'
      let conditionsLedgerToLedger =' WHERE'
      Object.entries(conditions).forEach(([key,value]) => {
      if  (request.query.hasOwnProperty(key)) {
        // query.values.push(request.query[key]);
        conditionsAccountLedger +=conditions[key][1] + ' AND ';
        conditionsLedgerToLedger +=conditions[key][2] + ' AND ';
        }
      });
      query.text ='SELECT \'AL\' AS "d_transactionType","bAccountTransaction".id AS "t_id", "entryDetails" AS "t_entryDetails", ' + 
      '"bAccountTransaction"."ledgerNoId" AS "t_ledgerNoId", "bAccountTransaction"."accountId" AS "t_accountId", ' +
      '"dataTime"::timestamp without time zone AS "t_dataTime", "extTransactionId" AS "t_extTransactionId", "amountTransaction" AS "t_amountTransaction", '+
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
      '"dateTime"::timestamp without time zone AS "t_dataTime", "extTransactionId" AS "t_extTransactionId", "amount" AS "t_amountTransaction", '+
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
    case 'GetbLastClosedAccountingDate':
      query.text ='SELECT "FirstOpenedDate"::date, "LastClosedDate"::date FROM "bLastClosedAccountingDate";'
    break;
    case 'GetbParamsgfirstOpenedDate':
      query.text ='SELECT "FirstOpenedDate"::date from "gAppMainParams";'
    break;
    case 'GetbbalacedDateWithEntries':
      query.text ='SELECT ARRAY_AGG("dateAcc"::date) as datesarray FROM "vbBalancedDatesWithEntries";'
    break;
    case 'GetbAccountingDateToClose':
      query.text ='SELECT "accountingDateToClose" FROM "bAccountingDateToClose";'
    break;
    case 'SumTransactionPerDate':
      query.text ='SELECT "amountTransaction" FROM f_a_b_sum_transactions_per_date(${balanceDate});'
    break;
    case 'GetDeepBalanceCheck':
      query.text ='SELECT * FROM public.f_a_b_balancesheet_deep_check(${dateBalanceToCheck},${firstDayOfCalculation});'
    break;
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
          2: ' ("accountNo" = ANY(${noAccountLedger})) ',
          3: ' ("accountNo" = ANY(${noAccountLedger})) ',
        },
        'dateRangeStart': {
          1: ' ("dateBalance"::date >= ${dateRangeStart}::date )',
          2: ' ("dataTime"::date >= ${dateRangeStart}::date )',
          3: ' ("dataTime"::date >= ${dateRangeStart}::date )',
        },
        'dateRangeEnd': {
          1: ' ("dateBalance"::date <= ${dateRangeEnd}::date) ',
          2: ' ("dataTime"::date <= ${dateRangeEnd}::date) ',
          3: ' ("dataTime"::date <= ${dateRangeEnd}::date) ',
        }
        /* 'entryTypes' : {
          1: ' ("XactTypeCode_Ext" = ANY(array[${entryTypes:raw}]))',
        }
 */      }

      let conditionsBalance =' WHERE'
      let conditionsAccountProject =' WHERE'
      let conditionsLedgerProject =' WHERE'
      Object.entries(conditions).forEach(([key,value]) => {
      if  (request.query.hasOwnProperty(key)) {
        // query.values.push(request.query[key]);
        conditionsBalance +=conditions[key][1] + ' AND ';
        conditionsAccountProject +=conditions[key][2] + ' AND ';
        conditionsLedgerProject +=conditions[key][3] + ' AND ';
        }
      });
      query.text ='SELECT '+
      ' "accountNo", "accountId", "accountType", "datePreviousBalance" ,"dateBalance"::timestamp without time zone , "openingBalance", '+
      ' "totalDebit", "totalCredit", "OutGoingBalance", "checkClosing", "xacttypecode" ' +
      ' FROM f_a_b_balancesheet_all() ';
       query.text += conditionsBalance.slice(0,-5);
       query.text += ' UNION '+
      ' SELECT '+
      ' "accountNo", "accountId", \'Account\', null ,"dataTime"::timestamp without time zone , "corrOpeningBalance", "totalDebit", "totalCredit", '+
      ' "corrOpeningBalance" + "signedTurnOver" AS "OutGoingBalance", 0 , "xActTypeCode"'+
      ' FROM f_a_b_current_turnovers_and_balnces_not_closed(${lastClosedDate}) ';
       query.text += conditionsAccountProject.slice(0,-5) ;
       query.text += ' UNION '+
      ' SELECT '   +
      ' "accountNo", "accountId", \'Ledger\', null ,"dataTime"::timestamp without time zone , "corrOpeningBalance" ,"totalDebit", "totalCredit", '  +
      ' ("corrOpeningBalance" + "signedTurnOver") AS "OutGoingBalance" , 0, "xActTypeCode" ' +
      ' FROM f_a_b_bcurrent_ledger_turnovers_balances_notclosed(${lastClosedDate}) '; 
      query.text += conditionsLedgerProject.slice(0,-5) ;
      query.text += ' ORDER BY "dateBalance"::timestamp without time zone DESC;';
    break;
  }
  query.text = pgp.as.format(query.text,request.query);
  db_common_api.queryExecute(query.text,response,null, request.query.queryCode === undefined?  request.query.Action : request.query.queryCode );
}
async function fGetMT950Transactions (request,response) {
  let sqlText;
  switch (request.query.Action) {
    case 'GetSWIFTsList':
      conditions = {
        'dateMessage':{
          1: ' ("bSWIFTGlobalMsg"."DateMsg"::timestamp without time zone = ${dateMessage}) ',
        }
      }
      let bSWIFTGlobalMsg =' WHERE'
      Object.entries(conditions).forEach(([key]) => request.query.hasOwnProperty(key)? bSWIFTGlobalMsg +=conditions[key][1]+' AND ': null);
      sqlText = 'SELECT ' + 
      ' id, "msgId", "senderBIC", "DateMsg"::timestamp without time zone, "typeMsg", "accountNo", '+
      '"bLedger"."ledgerNo", "ledgerNoId"'+ 
      ' FROM public."bSWIFTGlobalMsg" ' +
      ' LEFT JOIN public."bLedger" ON "bSWIFTGlobalMsg"."accountNo" = "bLedger"."externalAccountNo" ';
      sqlText += bSWIFTGlobalMsg.slice(0,-5) + ' ORDER BY id; '
    break;
    case 'GetMT950Transactions':
      sqlText ='SELECT '+
        'id, "msgId", "amountTransaction", "typeTransaction", "valueDate"::timestamp without time zone, comment, "entryAllocatedId", "refTransaction", "entriesAllocated"."entriesAmount" '+
        'FROM public."bSWIFTStatement" ' +
        'LEFT JOIN "entriesAllocated" ON "bSWIFTStatement".id = "entriesAllocated"."extTransactionId" '+
        'WHERE ("msgId"= ${id}) ORDER BY "msgId", id; '
    break;
    case 'DatesWithSWIFT':
      sqlText ='SELECT ARRAY_AGG( DISTINCT "DateMsg"::date) as datesarray FROM public."bSWIFTGlobalMsg";';
    break;
  }
  sql = pgp.as.format(sqlText,request.query);
  db_common_api.queryExecute(sql,response,null,request.query.Action);
}
async function GetEntryScheme (request, response) {
  let conditions = {}
  let sql='';
  conditions = {
    'cxActTypeCode_Ext':{
      1: '("cxActTypeCode_Ext" = ${cxActTypeCode_Ext})',
    },
    'cxActTypeCode':{
      1: '"cxActTypeCode" = ${cxActTypeCode}',
    },
    'cLedgerType':{
      1: '("cLedgerType" = ${cLedgerType})',
    },
    'cSchemeGroupId':{
      1: '("cSchemeGroupId" = ${cSchemeGroupId})',
    },
    'price': {
      1: '(price BETWEEN ${price_min} AND ${price_max})',
    },
    'tdate_min': {
      1: '(tdate::timestamp without time zone >= ${tdate_min}::date )',
    },
    'tdate_max': {
      1: '(tdate::timestamp without time zone <= ${tdate_max}::date )',
    },
    'secidList' : {
      1: '(LOWER(secid) = ANY(array[${secidList}]))  ',
    }
  }
  let conditionsTrades =' WHERE'
  Object.entries(conditions).forEach(([key,value]) => {
  if  (request.query.hasOwnProperty(key)) {
    request.query[key]!=='null'? conditionsTrades +=conditions[key][1] + ' AND ': null;
    }
  });

  switch (request.query.entryType) {
    case 'LL':
      sql = 'SELECT "ledgerID", "dateTime", "ledgerID_Debit", "amount", "entryDetails",  "XactTypeCode", "XactTypeCode_Ext", "extTransactionId", idtrade FROM public."bcSchemeLedgerTransaction" ';
    break;
    default:
      sql='SELECT "ledgerNoId" , "dataTime", "XactTypeCode", "XactTypeCode_Ext" , "accountId", "amountTransaction", "entryDetails", "extTransactionId",idtrade FROM public."bcSchemeAccountTransaction" ';
    break;
  }
  sql +=conditionsTrades.slice(0,-5);
  sql = pgp.as.format(sql,request.query)
  pool.query (sql,  (err, res) => {if (err) {
      console.log (err.stack.split("\n", 1).join(""))
      err.detail = err.stack
      return response.send(err)
    } else {
      if (res.rows.length !== 0) {
        let entryDraftData = [];
        res.rows.forEach(draft=> entryDraftData.push(JSON.stringify(JSON.parse (pgp.as.format (JSON.stringify(draft), request.query)))));
        switch (request.query.entryType) {
          case 'LL':
            sql = 'SELECT ' + 
            '"bLedger"."ledgerNo", "bLedgerDebit"."ledgerNo", "bcTransactionType_Ext"."xActTypeCode_Ext", "bcTransactionType_DE"."name", '+ 'json_populate_recordset.* ' +
            'FROM json_populate_recordset(null::public."bcSchemeLedgerTransaction",\'[' + entryDraftData +']\') ' +
            'LEFT JOIN "bcTransactionType_Ext" ON "bcTransactionType_Ext".id = json_populate_recordset."XactTypeCode_Ext" ' +
            'LEFT JOIN "bcTransactionType_DE" ON "bcTransactionType_DE"."xActTypeCode" = json_populate_recordset."XactTypeCode" ' +
            'LEFT JOIN "bLedger" ON "bLedger"."ledgerNoId"::text = json_populate_recordset."ledgerID" '+
            'LEFT JOIN "bLedger" AS "bLedgerDebit" ON "bLedgerDebit"."ledgerNoId"::text = json_populate_recordset."ledgerID_Debit";'
          break;
          default:
            sql = 'SELECT ' + 
            '"bLedger"."ledgerNo", "bAccounts"."accountNo", "bcTransactionType_Ext"."xActTypeCode_Ext", "bcTransactionType_DE"."name", '+ 'json_populate_recordset.* ' +
            'FROM json_populate_recordset(null::public."bAccountTransaction",\'[' + entryDraftData +']\') ' +
            'LEFT JOIN "bcTransactionType_Ext" ON "bcTransactionType_Ext".id = json_populate_recordset."XactTypeCode_Ext" ' +
            'LEFT JOIN "bcTransactionType_DE" ON "bcTransactionType_DE"."xActTypeCode" = json_populate_recordset."XactTypeCode" ' +
            'LEFT JOIN "bLedger" ON "bLedger"."ledgerNoId" = json_populate_recordset."ledgerNoId"	' +
            'LEFT JOIN "bAccounts" ON "bAccounts"."accountId" = json_populate_recordset."accountId";'; 	
          break;
          
        }
        db_common_api.queryExecute(sql,response,null,'STP_Get Entry Scheme');
      }
    }
  })
}
async function fCreateEntryAccountingInsertRow (request, response) {
    fields = Object.keys(request.body.data).map(filed => `"${filed}"`).join()
    let sqlText = 'INSERT INTO public."bAccountTransaction" '+'('+fields+')'+' VALUES ('+Object.values(request.body.data).map(value =>`'${value}'`).join() + ');';
    db_common_api.queryExecute(sqlText,response,'STP_f Create Entry Accounting InsertRow')
}
async function faccountingOverdraftAccountCheck (request, response) {
  let sqlText = 'SELECT "accountId", "openingBalance", CAST ("closingBalance" AS NUMERIC) AS "closingBalance", "closingBalance" AS "EndBalance"'+
  'FROM f_checkoverdraftbyaccountandbydate'+
  '(${transactionDate}, ${accountId}, ${xactTypeCode}, ${transactionAmount}, ${id}, ${FirstOpenedAccountingDate}) ;';
  sql = pgp.as.format(sqlText,request.query);
  db_common_api.queryExecute(sql,response,null, 'Account Overdraft Check')
}
async function faccountingOverdraftLedgerAccountCheck (request, response) {
  let sqlText =  'SELECT *, CAST(("openingBalance" +	"accountTransaction" + "CrSignAmount" + "DbSignAmount" + "signedTransactionAmount") AS numeric) as "closingBalance" FROM f_CheckOverdraftByLedgerAndByDate'+
  '(${transactionDate}, ${accountId}, ${xactTypeCode}, ${transactionAmount}, ${id}, ${FirstOpenedAccountingDate} );';
  sql = pgp.as.format(sqlText,request.query);
  db_common_api.queryExecute(sql,response,null,'Ledger Overdraft Check')
}
async function faccountingBalanceCloseInsert (request, response) {
  sqlText = 'call p_a_b_balance_close(${closingDate})';
  sql = pgp.as.format(sqlText,request.body.data)
  db_common_api.queryExecute(sql,response,null,'Balance Day Close')
}
async function faccountingBalanceDayOpen (request, response) {
  sqlText = 'CALL p_a_b_balance_open (${dateToOpen}); '
  sql = pgp.as.format(sqlText,request.body.data);
  db_common_api.queryExecute(sql,response,null,'Balance Day Open');
}
async function fdeleteAllocationAccounting (request,response) {
  let sql = "select * from f_delete_allocation_accounting(ARRAY[${trades_to_delete}]);"
  sql = pgp.as.format(sql,request.body);
  db_common_api.queryExecute(sql,response,null,'fdeleteAllocationAccounting');
}
module.exports = {
  fGetMT950Transactions,
  fGetAccountingData,
  GetEntryScheme,
  fCreateEntryAccountingInsertRow,
  fUpdateAccountAccounting,
  fUpdateLedgerAccountAccounting,
  fUpdateLLEntryAccounting,
  fUpdateEntryAccountAccounting,
  faccountingOverdraftAccountCheck,
  faccountingOverdraftLedgerAccountCheck,
  faccountingBalanceCloseInsert,
  faccountingBalanceDayOpen,
  fdeleteAllocationAccounting,
  fCreateDepoSubAccounts,
  fcreateFIFOtransactions,
  fdeleteFIFOtransactions
}