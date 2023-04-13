const config = require ('./db_config');
const Pool = require('pg').Pool;
const pool = new Pool(config.dbConfig);
var pgp = require ('pg-promise')({capSQL:true});
const pg = require('pg');
pg.types.setTypeParser(1114, function(stringValue) {
  return stringValue;  //1114 for time without timezone type
});

async function finsertMarketData (request, response) {
  data = request.body.dataToInsert
//  console.log('request.body.dataToInsert',data[0]);
  const query = {
  text: 'INSERT INTO public.t_moexdata_foreignshares(' +
   ' boardid, tradedate,  secid,  value, open, low, high, legalcloseprice, waprice, close, volume, marketprice2,'+ 
   ' marketprice3, admittedquote, mp2valtrd, marketprice3tradesvalue, admittedvalue, waval, tradingsession,  numtrades)'+
   ' (SELECT '+   
      '"BOARDID", "TRADEDATE","SECID", "VALUE", "OPEN", "LOW", "HIGH", "LEGALCLOSEPRICE", "WAPRICE", "CLOSE", '+
      '"VOLUME", "MARKETPRICE2", "MARKETPRICE3", "ADMITTEDQUOTE", "MP2VALTRD", "MARKETPRICE3TRADESVALUE", '+
      '"ADMITTEDVALUE", "WAVAL", "TRADINGSESSION",  "NUMTRADES"	from  json_to_recordset( \'' + 
      JSON.stringify(data) +
    '\') as x (' +
   ' "BOARDID" text, "TRADEDATE" text, "SHORTNAME" text,"SECID" text,"VALUE" numeric,"OPEN" numeric, "LOW" numeric,  "HIGH" numeric,'+
   ' "LEGALCLOSEPRICE" numeric,"WAPRICE" numeric,"CLOSE" numeric,"VOLUME" numeric,"MARKETPRICE2" numeric, "MARKETPRICE3" numeric,'+
   ' "ADMITTEDQUOTE" numeric, "MP2VALTRD" numeric,"MARKETPRICE3TRADESVALUE" numeric,"ADMITTEDVALUE" numeric,'+
   ' "WAVAL" numeric, "TRADINGSESSION" numeric, 	"NUMTRADES" numeric ))'
  }
  // sql = pgp.as.format(query.text,query.values)
  console.log('sql',query.text);
  pool.query (query.text,  (err, res) => {if (err) {
    console.log (err.stack.split("\n", 1).join(""))
    err.detail = err.stack
    return response.send(err)
  } else {
    return response.status(200).json(res.rowCount)}
  })  
}
module.exports = {
  finsertMarketData
}


