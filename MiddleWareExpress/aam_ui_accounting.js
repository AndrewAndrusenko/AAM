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
  let fields =  ['accountNo','accountTypeExt','Information','clientId','currencyCode','entityTypeCode','idportfolio','secid','dateOpening']
  db_common_api.fUpdateTableDB ('bAccounts',fields,'accountId',request, response,['dateOpening'])
}
async function fUpdateLedgerAccountAccounting (request, response) {
  let fields =  ['accountTypeID', 'name', 'clientID', 'entityTypeCode', 'ledgerNo', 'currecyCode', 'ledgerNoCptyCode', 'ledgerNoTrade', 'externalAccountNo','dateOpening']
  db_common_api.fUpdateTableDB ('bLedger',fields,'ledgerNoId',request, response)
}
async function fCreateDepoSubAccounts (request,response) {
  let sql = "SELECT * FROM f_a_create_depo_accounts (ARRAY[${portfolioIds}],${secid});";
  sql = pgp.as.format(sql,request.body);
  db_common_api.queryExecute(sql,response,undefined,'fCreateDepoSubAccounts');
}
async function fdeleteAccountingFIFOtransactions (request,response) {
  let sql = 'SELECT * FROM f_a_delele_accounting_fifo_for_allocated_trade(ARRAY[${idtrades}])';
  sql = pgp.as.format(sql,request.body.params);
  db_common_api.queryExecute(sql,response,undefined,'fdeleteAccountingFIFOtransactions');
}
async function fcreateFIFOtransactions (request,response) {
  let sql = "SELECT * FROM f_fifo_create (${idportfolio},${secid},${qty_to_sell},${sell_price},${id_sell_trade},${tr_type});";
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
      query.text = 'SELECT id, TRIM("xActTypeCode_Ext") as "xActTypeCode_Ext", description, code2,manual_edit_forbidden FROM public."bcTransactionType_Ext" ORDER BY "xActTypeCode_Ext"; '
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
      '"bcEnityType"."entityTypeCode" as d_entityTypeCode, "bcEnityType"."name" as d_entityTypeDescription,"bcAccountType_Ext"."xActTypeCode"  as "d_APTypeCodeAccount", 0 as action,"dateOpening"::timestamp without time zone '+
      'FROM public."bAccounts" '+
      'LEFT JOIN dclients ON "bAccounts"."clientId" = dclients.idclient ' +
      'LEFT JOIN dportfolios ON dportfolios.idportfolio = "bAccounts"."idportfolio" ' +
      'LEFT JOIN "bcAccountType_Ext" ON "bcAccountType_Ext"."accountType_Ext" = "bAccounts"."accountTypeExt" ' +
      'LEFT JOIN "bcEnityType" ON "bcEnityType"."entityType" = "bAccounts"."entityTypeCode" '+
      'ORDER BY "accountId" DESC;';
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
        '"dclients"."clientname" as "d_Client", "dateOpening"::timestamp without time zone,'+ 
        ' "bcAccountType_Ext"."xActTypeCode"  as "d_APTypeCodeAccount", 0 as action '+
        'FROM public."bLedger" '+
        'LEFT JOIN "dclients" ON "bLedger"."clientID" = "dclients".idclient ' +
        'LEFT JOIN "bcAccountType_Ext" ON "bcAccountType_Ext"."accountType_Ext" = "bLedger"."accountTypeID" ;'
    break;
    case 'GetAccountsEntriesListAccounting':
      query.text = 'SELECT *,0 as action FROM f_a_b_get_all_entries_transactions (${dateRangeStart},${dateRangeEnd},${entryTypes:raw},${portfolioCodes},${noAccountLedger}, ${idtrade:raw},${entriesIds:raw});';
      request = db_common_api.getTransformArrayParam(request,['entryTypes','entriesIds']);
    break;
    case 'GetBalanceDatePerPorfoliosOnData':
      query.text = 'SELECT * FROM f_a_get_balances_for_date(${p_portfolio_list},${p_report_date})'
    break;
    case 'GetbLastClosedAccountingDate':
      query.text ='SELECT "FirstOpenedDate"::date, "LastClosedDate"::date FROM "bLastClosedAccountingDate" ;'
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
        },
        'dateRangeStart': {
          1: ' ("dateBalance"::date >= ${dateRangeStart}::date )',
        },
        'dateRangeEnd': {
          1: ' ("dateBalance"::date <= ${dateRangeEnd}::date) ',
        }
      }
      let conditionsBalance =' WHERE'
      Object.entries(conditions).forEach(([key,value]) => {
      if  (request.query.hasOwnProperty(key)) { conditionsBalance +=conditions[key][1] + ' AND '}
    });
    query.text = 'select * from f_a_b_balancesheet_total_closed_and_notclosed()'
      query.text += conditionsBalance.slice(0,-5);
    break;
  }
  query.text = pgp.as.format(query.text,request.query);
  if (['GetAccountsEntriesListAccounting'].includes(request.query.Action)) {
    request.query
    query.text = query.text.replaceAll("'null'",null);
    query.text = query.text.replaceAll("array[0,0]",null);
    query.text = query.text.replaceAll(",'ClearAll'",',null');
  }
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
      } else {
        response.status(200).json([])
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
  fCreateDepoSubAccounts,
  fcreateFIFOtransactions,
  fdeleteAccountingFIFOtransactions
}