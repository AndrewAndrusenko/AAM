const { async } = require('rxjs');
const config = require ('./db_config');
const Pool = require('pg').Pool;
const pool = new Pool(config.dbConfig);
var pgp = require ('pg-promise')({capSQL:true});
const pg = require('pg');
const { query } = require('express');
pg.types.setTypeParser(1114, function(stringValue) {
  return stringValue;  //1114 for time without timezone type
});
async function fdeleteMarketData (request,response) {
  const query = {
    text: 'DELETE FROM public.t_moexdata_foreignshares WHERE (sourcecode = ANY(array[${sourcecodes}]) AND tradedate::timestamp without time zone = ${dateToLoad}::date);'+
    'DELETE FROM  public.t_marketstack_eod WHERE (sourcecode = ANY(array[${sourcecodes}]) AND "date"::timestamp without time zone = ${dateToLoad}::date);'
  }
  console.log('body',request.body.params);
  sql = pgp.as.format(query.text,request.body.params);
  console.log('sql',sql);
  pool.query (sql,  (err, res) => 
  {if (err) {
   console.log (err.stack.split("\n", 1).join(""))
   err.detail = err.stack
   return response.send(err)
   } else {
console.log('res',res[0].rowCount);
     return response.status(200).json(res[0].rowCount + res[1].rowCount )
   }
  })  
}
async function finsertMarketData (request, response) {
  let sql = '';
  data = request.body.dataToInsert
  console.log('request.body.gloabalSource',request.body.gloabalSource);
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
    default:
    break;
  }

  // console.log (sql)
  pool.query (sql,  (err, res) => {if (err) {
    console.log (err.stack.split("\n", 1).join(""))
    err.detail = err.stack
    return response.send(err)
  } else {
    return response.status(200).json(res.rowCount)}
  })  
}
async function fgetMarketData (request,response){
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
  let conditionsmsFS = 'AND'
  Object.entries(conditions).forEach(([key,value]) => {
  if  (request.query.hasOwnProperty(key)) {
    query.values.push(request.query[key]);
    conditionsMOEXiss +=conditions[key][1] + ' AND ';
    conditionsmsFS +=conditions[key][2] + ' AND';
    }
  });
  switch (request.query.Action) {
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
      query.text = 'SELECT boardid, secid, numtrades, value, open, low, high, close, volume, marketprice2, admittedquote,  globalsource, sourcecode, tradedate, percentprice,currency, spsymbol '+
      'FROM t_moexdata_foreignshares '+
      'left join t_moex_boards on t_moex_boards.code = t_moexdata_foreignshares.boardid '
      query.text +=conditionsMOEXiss.slice(0,-5);
      query.text +='UNION '+
      "SELECT exchange, secid,null,null, open,low, high,  close, volume, adj_close, adj_close,  globalsource, sourcecode, date, false as percentprice, 'USD' as currency, '$' as spsymbol "+
      'FROM public.t_marketstack_eod '+
      'left join "aInstrumentsCodes" on "aInstrumentsCodes".code=t_marketstack_eod.symbol '+
      'where "aInstrumentsCodes".mapcode = \'msFS\'  ';
      query.text +=conditionsmsFS.slice(0,-3);

      query.text += ' ORDER BY tradedate DESC;'
    break;
  }
  console.log('request.query)',request.query);
  
  sql = pgp.as.format(query.text,request.query);
   console.log('sql',sql);
   pool.query (sql,  (err, res) => 
   {if (err) {
    console.log (err.stack.split("\n", 1).join(""))
    err.detail = err.stack
    return response.send(err)
    } else {
      return response.status(200).json(res.rows)
    }
  }) 
}
async function fgetMarketDataSources (request,response) {
   sql =  'SELECT  "sourceName", false AS "checkedAll", false AS indeterminate, false as disabled, json_agg("icMarketDataSources".*) AS "segments" '+
  'FROM "icMarketDataSourcesGlobal" '+
  'LEFT JOIN "icMarketDataSources" ON "icMarketDataSources"."sourceGlobal" = "icMarketDataSourcesGlobal"."sourceCode" '+
  'GROUP BY "sourceName" ';
  pool.query(sql, (err,res) => {if (err) {
    err.detail=err.stack;
    return res.send(err)} else {
      return response.status(200).send(res.rows)
    }
  })
}
async function fgetInstrumentsCodes (request,response) {
  let fields = request.query.resasarray? 'json_agg(code) as code' :' secid, code, isin, mapcode'	
  sql =  'SELECT ' + fields + '	FROM public."aInstrumentsCodes" WHERE mapcode=${mapcode};';
 sql = pgp.as.format(sql,request.query);
 console.log('sql',sql);
 pool.query (sql,  (err, res) => 
 {if (err) {
  console.log (err.stack.split("\n", 1).join(""))
  err.detail = err.stack
  return response.send(err)
  } else {
    return response.status(200).json(res.rows)
  }
}) 
}
module.exports = {
  finsertMarketData,
  fgetMarketData,
  fgetMarketDataSources,
  fdeleteMarketData,
  fgetInstrumentsCodes
}


