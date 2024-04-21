const db_common_api = require('./db_common_api');
const https = require('https');
const config = require ('./db_config');
const Pool = require('pg').Pool;
const pool = new Pool(config.dbConfig);
var pgp = require ('pg-promise')({capSQL:true});
const pg = require('pg');
pg.types.setTypeParser(1114, function(stringValue) {
  return stringValue;  //1114 for time without timezone type
});
async function fupdateMarketQuote (request, response) {
  let fields = ['tradedate', 'boardid', 'secid',  'open', 'low', 'high',  'close','sourcecode','globalsource']
 db_common_api.fUpdateTableDB ('t_moexdata_foreignshares',fields,'id',request, response)
}
async function fdeleteMarketData (request,response) {//Delete market data if a user decided to overwirte it
  const query = {
    text: 'DELETE FROM public.t_moexdata_foreignshares WHERE (sourcecode = ANY(array[${sourcecodes}]) AND tradedate::timestamp without time zone = ${dateToLoad}::date);'+
    'DELETE FROM  public.t_marketstack_eod WHERE (sourcecode = ANY(array[${sourcecodes}]) AND "date"::timestamp without time zone = ${dateToLoad}::date);'
  }
  sql = pgp.as.format(query.text,request.body.params);
  pool.query (sql,  (err, res) => 
  {if (err) {
    console.log (err.stack.split("\n", 1).join(""))
    err.detail = err.stack
    return response.send(err)
    } else {
      return response.status(200).json({deletedRows: res[0].rowCount + res[1].rowCount})
    }
  })  
}
async function finsertMarketData (request, response) {//Insert market data recieved form moex iss or MScom
  let sql = '';
  data = request.body.dataToInsert
  switch (request.body.gloabalSource) {
    case 'MOEXiss':
    sql =  ''+
    ' INSERT INTO public.t_moexdata_foreignshares(' +
      ' globalsource,sourcecode, boardid, tradedate,  secid,  value, open, low, high, legalcloseprice,'+
      ' waprice, close, volume, marketprice2, marketprice3, admittedquote, mp2valtrd, marketprice3tradesvalue, '+
      ' admittedvalue, waval, tradingsession,  numtrades'+
    ')'+
    '(SELECT \''+ request.body.gloabalSource+'\',\''+ request.body.sourceCode+'\', ' + 
       '"BOARDID", "TRADEDATE","SECID", "VALUE", "OPEN", "LOW", "HIGH", "LEGALCLOSEPRICE", "WAPRICE", "CLOSE", '+
       '"VOLUME", "MARKETPRICE2", "MARKETPRICE3", "ADMITTEDQUOTE", "MP2VALTRD", "MARKETPRICE3TRADESVALUE", '+
       '"ADMITTEDVALUE", "WAVAL", "TRADINGSESSION",  "NUMTRADES" '+
       ' FROM  json_to_recordset( \'' + JSON.stringify(data) + '\') as x (' +
          '"BOARDID" text, "TRADEDATE" date, "SHORTNAME" text,"SECID" text,"VALUE" numeric,"OPEN" numeric, "LOW" numeric, '+
          '"HIGH" numeric, "LEGALCLOSEPRICE" numeric,"WAPRICE" numeric,"CLOSE" numeric,"VOLUME" numeric, '+
          '"MARKETPRICE2" numeric, "MARKETPRICE3" numeric, "ADMITTEDQUOTE" numeric, "MP2VALTRD" numeric, '+
          '"MARKETPRICE3TRADESVALUE" numeric,"ADMITTEDVALUE" numeric,"WAVAL" numeric,"TRADINGSESSION" numeric,"NUMTRADES" numeric'+ 
        ')'+
     ')' 
    break;
    case 'MScom':
    sql = ''+
    'INSERT INTO public.t_marketstack_eod('+
     'globalsource,sourcecode,"open", high, low, close, volume, adj_high, adj_low, adj_close, adj_open, adj_volume, '+
     'split_factor, dividend, symbol, exchange, "date"'+
     ')'+
     '(SELECT \''+ request.body.gloabalSource+'\',\''+ request.body.sourceCode+'\', ' + 
     '"open", high, low, close, volume, adj_high, adj_low, adj_close, adj_open, adj_volume, '+
     'split_factor, dividend, symbol, exchange, "date"::timestamp without time zone '+
     'FROM json_to_recordset(\''	+ JSON.stringify(data) + '\') as x ( '+
       '"open" numeric, high numeric, low numeric , close numeric, volume numeric, adj_high numeric, adj_low numeric,'+
       'adj_close numeric, adj_open numeric, adj_volume numeric, split_factor numeric, dividend numeric, symbol text, '+
       'exchange text, "date" date'+
      ')'+
    ') ' 
    break;
    case 'MScomMoveToMainTable':
      sql='select * from f_t_move_quotes_marketstackget_to_main_table(${date_to_move}::date,0);'
    default:
    break;
  }
  sql = pgp.as.format(sql,request.body)
  db_common_api.queryExecute(sql,response,request.body.gloabalSource==='MScomMoveToMainTable'? undefined :'rowCount','finsertMarketData')
}
async function fgetMarketData (request,response){//Get market data such as market prices, volumes, high, low quotes and etc
  let conditions = {}
  const query = {text: '', values:[]}
  conditions = {
    'secid':{
      1: ' (secid = ANY(array[${secid:raw}]))',
      2: ' (secid = ANY(array[${secid:raw}]))',
    },
    'dateRangeStart': {
      1: '(tradedate::timestamp without time zone >= ${dateRangeStart}::date )',
      2: '(date >= ${dateRangeStart}::date )',
    },
    'dateRangeEnd': {
      1: '(tradedate::timestamp without time zone <= ${dateRangeEnd}::date) ',
      2: '(date <= ${dateRangeEnd}::date) ',
    },
    'boardid' : {
      1: '(boardid = ANY(array[${boardid}]))',
      2: '(exchange = ANY(array[${boardid}]))',
    },
    'sourcecode' : {
      1: '(sourcecode = ANY(array[${sourcecode}]))  ',
      2: '(sourcecode = ANY(array[${sourcecode}]))  '
    }
  }
  let conditionsMOEXiss =' WHERE'
  let conditionsmsFS = ' AND'
  Object.entries(conditions).forEach(([key,value]) => {
  if  (request.query.hasOwnProperty(key)) {
    query.values.push(request.query[key]);
    conditionsMOEXiss +=conditions[key][1] + ' AND ';
    conditionsmsFS +=conditions[key][2] + ' AND';
    }
  });
  switch (request.query.Action) {
    case 'getMarketQuote':
      query.text = 'SELECT *, (SELECT rate FROM f_i_get_cross_rate_for_trade(${trade_currency},tt.currency_code,${trade_date},810)) as rate '+
                  'FROM f_i_get_market_quote_for_trade(${secid},${trade_date}) tt';
    break;
    case 'checkLoadedMarketData':
      query.text = 'SELECT sourcecode, count(secid) FROM t_moexdata_foreignshares '+
      'WHERE (sourcecode = ANY(array[${sourcecodes}]) AND tradedate::timestamp without time zone = ${dateToLoad}::date) '+
      'GROUP BY sourcecode '+
      'UNION ' +
      'SELECT sourcecode,count(symbol)	FROM public.t_marketstack_eod '+
      'WHERE (sourcecode = ANY(array[${sourcecodes}]) AND "date"::timestamp without time zone =  ${dateToLoad}::date) '+
      'GROUP BY sourcecode ';
    break;
    default :  
      query.text = 'SELECT t_moexdata_foreignshares.id, boardid, secid, numtrades, value, open, low, high, close, volume, marketprice2, admittedquote,  globalsource, sourcecode, tradedate, percentprice,currency, spsymbol '+
      'FROM t_moexdata_foreignshares '+
      'left join t_moex_boards on t_moex_boards.code = t_moexdata_foreignshares.boardid '
      query.text +=conditionsMOEXiss.slice(0,-5);
      query.text += request.query.hasOwnProperty('sorting')? ' ORDER BY ${sorting:raw} LIMIT ${rowslimit:raw};' : ';';
    break;
  }
  sql = pgp.as.format(query.text,request.query);
  db_common_api.queryExecute(sql,response,undefined,'fgetMarketData')
}
async function fgetMarketDataSources (request,response) {//Get market sources. Needs to be moved to General data function
  sql =  'SELECT  max("icMarketDataSources".type) as "type", "sourceName", false AS "checkedAll", false AS indeterminate, false as disabled, json_agg("icMarketDataSources".*) AS "segments" '+
  'FROM "icMarketDataSourcesGlobal" '+
  'LEFT JOIN "icMarketDataSources" ON "icMarketDataSources"."sourceGlobal" = "icMarketDataSourcesGlobal"."sourceCode"  GROUP BY "sourceName" ;';
  db_common_api.queryExecute(sql,response,undefined,'fgetMarketDataSources')
}
async function fgetInstrumentsCodes (request,response) {//Get additional instruments codes, for example to import quotes from global market data source
  let fields = request.query.resasarray? 'json_agg(code) as code' :' secid, code, isin, mapcode'	
  sql =  'SELECT ' + fields + '	FROM public."aInstrumentsCodes" WHERE mapcode=${mapcode};';
  sql = pgp.as.format(sql,request.query);
  db_common_api.queryExecute(sql,response,undefined,'fgetInstrumentsCodes')
}
async function fgetMoexIssSecuritiesList (start) {//Get instrument dictionary from moex iss
  let url='https://iss.moex.com/iss/securities.json?iss.json=extended&limit=100&lang=en&iss.meta=off&is_trading=true&start='+start.toString()
  return new Promise ((resolve) => {
    https.get(url, (resp) => {
      let data = '';
      resp.on('data', (chunk) => {data += chunk});
      resp.on('end', () => {
        rowsretrived = JSON.parse(data)[1].securities.length;
        sql ="insert into mmoexsecurities select * from json_populate_recordset(null::mmoexsecurities, (select REPLACE($$'" + JSON.stringify(JSON.parse(data)[1].securities) + "'$$,$$'$$, '')::json));"
        pool.query (sql,  (err, res) => {
          if (err) {
            console.log (err.stack.split("\n", 1).join(""))
            err.detail = err.stack
            resolve(err)
          } else {
            resolve(res['data'].rowCount, res)
          }
        })  
      });
    })
  })
}
async function fimportMoexInstrumentsList (request, response){ //Update instrument table based on MOEX data
  let rowsretrived = 100
  for (let index = 0; rowsretrived === 100&&index<50000; index=index+100) {
    res = await fgetMoexIssSecuritiesList(index);
    typeof(res)===Number? console.log('inserted ', res,' rows'): console.log('error ', res);
  } 
}
function fGetMoexInstruments(request,response) { //Get general instruments list
  return new Promise  (async (resolve) => {
    let conditions = {}
    const query = {text: '', values:[]}
    conditions = {
      'secid':{
        1: ' (secid = ANY(${secid:raw}))',
      },
      'boardid' : {
        1: '(boardid = ANY(array[${boardid}]))',
      },
      'sourcecode' : {
        1: '(sourcecode = ANY(array[${sourcecode}]))  ',
      },
      'securityGroup' : {
        1: '(mmoexsecuritytypes.security_group_name  = ANY(array[${securityGroup}]))  ',
      },
      'isin' : {
        1: '(mmoexsecurities.isin  = ${isin})  ',
      }
    }
    let conditionsMOEXiss =' WHERE'
    Object.entries(conditions).forEach(([key,value]) => {
      if  (request.query.hasOwnProperty(key)) {
        // query.values.push(request.query[key]);
        conditionsMOEXiss +=conditions[key][1] + ' AND ';
      }
    });
    switch (request.query.Action) {
      case 'getInstrumentAutoCompleteList' :
        query.text = "SELECT secid, name, security_type_name,faceunit,facevalue FROM public.mmoexsecurities " +
        "LEFT JOIN mmoexsecuritytypes ON mmoexsecurities.type=mmoexsecuritytypes.security_type_name " +
        "WHERE mmoexsecuritytypes.trade_engine_name !='futures'"
        query.rowMode= 'array';
      break;
      case 'getInstrumentFutures' :
        query.text = "SELECT secid FROM public.mmoexsecurities " +
        "LEFT JOIN mmoexsecuritytypes ON mmoexsecurities.type=mmoexsecuritytypes.security_type_name " +
        "WHERE mmoexsecuritytypes.trade_engine_name ='futures'"
      break;
      default :  
        query.text = 
        "SELECT  mmoexsecuritygroups.id as groupid, mmoexsecurities.id, secid, security_type_title, stock_type, security_type_name, shortname, "+ 
        " primary_boardid, board_title, mmoexboardgroups.title,mmoexboardgroups.category, mmoexsecurities.name, "+
        " COALESCE(mmoexsecurities.isin,'') as isin, emitent_title, emitent_inn, type, \"group\", marketprice_boardid, mmoexsecuritygroups.title as group_title, security_group_name, 0 as action, faceunit, facevalue, maturitydate, regnumeric,listing "+
        "FROM public.mmoexsecurities " +
        "LEFT JOIN mmoexsecuritytypes ON mmoexsecurities.type=mmoexsecuritytypes.security_type_name "+
        "LEFT JOIN mmoexsecuritygroups ON mmoexsecuritygroups.name=mmoexsecuritytypes.security_group_name "+
        "LEFT JOIN mmoexboards ON mmoexboards.boardid = mmoexsecurities.primary_boardid "+
        "LEFT JOIN mmoexboardgroups ON mmoexboardgroups.board_group_id = mmoexboards.board_group_id "
        query.text +=conditionsMOEXiss.slice (0,-5)
        query.text += '  LIMIT ${rowslimit:raw};'
      break;
    }
    query.text = pgp.as.format(query.text,request.query);
    resolve (db_common_api.queryExecute (query, response,undefined,request.query.Action?request.query.Action:'fGetMoexInstruments' ))
  })
}
async function fgetInstrumentDetails (request,response) {
  let sql = "SELECT secid, boardid, shortname, lotsize, facevalue, status, boardname, decimals, matdate::timestamp without time zone, secname, couponperiod, issuesize, remarks, marketcode, instrid, sectorid, minstep, faceunit, isin, latname, regnumber, currencyid, sectype, listlevel, issuesizeplaced, couponpercent, lotvalue, nextcoupon, issuesize*facevalue as issuevolume, id "+ 
  'FROM public.mmoexinstrumentdetails '
  sql += request.query.secid? "WHERE secid ='"   +request.query.secid +"';": ";" 
  db_common_api.queryExecute(sql,response,undefined,'fgetInstrumentDetails');

}
async function fgetInstrumentDataCorpActions (request,response) {
  let sql = "SELECT mmoexcorpactions.id, secid, currency, unredemeedvalue, couponrate, couponamount, actiontype::int2, couponamountrur, date::timestamp without time zone as date, 0 as action, dccorporateactionstypes.name as actiontypename FROM public.mmoexcorpactions " +
  " LEFT JOIN dccorporateactionstypes on dccorporateactionstypes.id = mmoexcorpactions.actiontype ";
  sql += request.query.isin? "WHERE isin ='"   + request.query.isin +"' ": "";
  sql += " ORDER BY date; "
  db_common_api.queryExecute(sql,response,undefined,'fgetInstrumentDataCorpActions');
}
async function fgetInstrumentDataGeneral(request,response) { 
  const query = {text: '', values:[]}
  switch (request.query.dataType) {
    case 'getBoardsDataFromInstruments':
      query.text = "SELECT boardid, board_title FROM public.mmoexboards "  +
      "WHERE is_traded=1 " +
      "ORDER BY boardid asc;"
    break;
    case 'getMoexSecurityTypes':
      query.text = "SELECT id, security_type_name, security_type_title,security_group_name,price_type FROM public.mmoexsecuritytypes; " 
    break;
    case 'getCorpActionTypes':
      query.text = "SELECT  dccorporateactionstypes.id, dccorporateactionstypes.name, sectype, ismandatory, ratetype, fixedrate "+
      "FROM public.dccorporateactionstypes;"
    break;
    case 'getMoexSecurityGroups':
      query.text = "SELECT name, title  FROM public.mmoexsecuritygroups;"
    break;

    case 'validateSecidForUnique':
      query.text = "SELECT secid  FROM public.mmoexsecurities where UPPER(secid)=${fieldtoCheck};"
    break;
    case 'validateISINForUnique':
      query.text = "SELECT isin  FROM public.mmoexsecurities where UPPER(isin)=${fieldtoCheck};"
    break;

  }
  sql = pgp.as.format(query.text,request.query);
  db_common_api.queryExecute(sql,response,undefined,request.query.dataType);
}
async function fInstrumentCreate (request, response) {
  const query = {
  text: 'INSERT INTO public.mmoexsecurities ' +
        '(secid, name, isin,  emitent_title, emitent_inn, type, "group", primary_boardid, marketprice_boardid, regnumeric, maturitydate, facevalue, faceunit)' +
        ' VALUES (UPPER(${secid}),${name},UPPER(${isin}),${emitent_title},${emitent_inn},${type},${group},${primary_boardid},${marketprice_boardid},${regnumeric},${maturitydate},${facevalue},${faceunit} ) RETURNING *;',
  }
  sql = pgp.as.format(query.text,request.body.data)
  db_common_api.queryExecute(sql,response,undefined,'fInstrumentCreate');
}
async function fInstrumentDelete (request, response) {
  const query = {text: 'DELETE FROM public.mmoexsecurities WHERE id=${id} RETURNING *;', values: request.body}
  sql = pgp.as.format(query.text,query.values)
  db_common_api.queryExecute(sql,response,undefined,'fInstrumentDelete');
}
async function fInstrumentEdit (request, response) {
  const query = {
    text: 'UPDATE public.mmoexsecurities ' +
    'SET  ' +
    'secid=UPPER(${secid}), '+
    'name=${name}, '+
    'emitent_title=${emitent_title}, '+
    'isin=UPPER(${isin}), '+
    'emitent_inn=${emitent_inn}, '+
    'type=${type}, '+
    '"group"=${group}, '+
    'primary_boardid=${primary_boardid}, '+
    'marketprice_boardid=${marketprice_boardid}, '+
    'faceunit=${faceunit}, '+
    'facevalue=${facevalue}, '+
    'maturitydate=${maturitydate}, '+
    'listing=${listing}, '+
    'regnumeric=${regnumeric} '+
    'WHERE id=${id} RETURNING *;',
  } 
  sql = pgp.as.format(query.text,request.body.data);
  db_common_api.queryExecute(sql,response,undefined,'fInstrumentEdit');
}
async function fUpdateInstrumentDetails (request, response) {
  let fields = 'status,  boardid, boardname,  listlevel,  issuesize,   lotsize,  minstep,  decimals, marketcode,   secid'
  let values = fields.split(',').map(el=>'${'+el+'}')
  let updatePairs = fields.split(',').map(el=> el+'=${'+el+'}')
  switch (request.body.action) {
    case 'Create':
      sqlText = 'INSERT INTO public.mmoexinstrumentdetails ('+ fields +') VALUES ('+ values + ') RETURNING *;'
    break;
    case 'Edit':
      sqlText = 'UPDATE public.mmoexinstrumentdetails SET  ' + updatePairs + ' WHERE id=${id} RETURNING *;'
      break;
    case 'Delete':
      sqlText = 'DELETE FROM public.mmoexinstrumentdetails WHERE id=${id} RETURNING *;'
    break;
  }
  sql = pgp.as.format(sqlText,request.body.data)
  db_common_api.queryExecute (sql, response,null,'fUpdateInstrumentDetails_'+request.body.action);
}
async function fUpdateInstrumentDataCorpActions (request, response) {
  let fields = ' secid, currency,  unredemeedvalue,  couponrate,   couponamount,  actiontype,  date, couponamountrur'
  let values = fields.split(',').map(el=>'${'+el+'}')
  let updatePairs = fields.split(',').map(el=> el+'=${'+el+'}')
  switch (request.body.action) {
    case 'Create':
      sqlText = 'INSERT INTO public.mmoexcorpactions ('+ fields +') VALUES ('+ values + ') RETURNING *;'
    break;
    case 'Edit':
      sqlText = 'UPDATE public.mmoexcorpactions SET  ' + updatePairs + ' WHERE id=${id} RETURNING *;'
      break;
    case 'Delete':
      sqlText = 'DELETE FROM public.mmoexcorpactions WHERE id=${id} RETURNING *;'
    break;
  }
  sql = pgp.as.format(sqlText,request.body.data)
  db_common_api.queryExecute (sql, response,null,'fUpdateInstrumentDataCorpActions_'+request.body.action);
}

module.exports = {
  finsertMarketData,
  fgetMarketData,
  fgetMarketDataSources,
  fdeleteMarketData,
  fgetInstrumentsCodes,
  fimportMoexInstrumentsList,
  fGetMoexInstruments,
  fgetInstrumentDataGeneral,
  fgetInstrumentDetails,
  fgetInstrumentDataCorpActions,
  fInstrumentCreate,
  fInstrumentEdit,
  fInstrumentDelete,
  fUpdateInstrumentDetails,
  fUpdateInstrumentDataCorpActions,
  fupdateMarketQuote
}


