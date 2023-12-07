const db_common_api = require('./db_common_api');
var pgp = require ('pg-promise')({capSQL:true});
const https = require('https');

async function getCurrencyData (request,response) {
  let sql='';
  let conditions = {}
  const query = {text: '', values:[]}
  conditions = {
    'pairs':{
      1: '(quote_currency."CurrencyCode"||\'/\'||base_currency."CurrencyCode"= ANY(array[${pairs:raw}]))',
    },
    'dateRangeStart': {
      1: '(rate_date::timestamp without time zone >= ${dateRangeStart}::date )',
    },
    'dateRangeEnd': {
      1: '(rate_date::timestamp without time zone <= ${dateRangeEnd}::date) ',
    },
    'sourcecode' : {
      1: '(sourcecode = ANY(array[${sourcecode}]))  ',
    }
  }
  let conditionsCurrency =' WHERE'
  Object.entries(conditions).forEach(([key,value]) => {
  if  (request.query.hasOwnProperty(key)) {
    query.values.push(request.query[key]);
    conditionsCurrency +=conditions[key][1] + ' AND ';
    }
  });
  switch (request.query.dataType) {
    case 'checkLoadedRatesData':
      sql = 'SELECT rate FROM public.dcurrencies_rates '+
      ' WHERE rate_date::timestamp without time zone = ${date} and sourcecode=ANY(array[${sourcecode}]) LIMIT 1 ;'
    break;
    case 'getCurrencyCodes':
      sql = 'SELECT  "CurrencyCodeNum","CurrencyCode","CurrencyName", symbol FROM public."dCurrencies";'
    break;
    case 'getPairsList':
      sql = 'SELECT id, quote||\'/\'||base as pair, base, quote, nominal FROM public.dcurrencies_pairs;'
    break;
    case 'getCurrencyRate':
      sql = 'SELECT  base_code, id, quote_code, rate, rate_date::timestamp without time zone, rate_type FROM public.dcurrencies_rates ' +
      'WHERE base_code=${base} and quote_code=${quote} and rate_date <= ${date} ORDER by rate_date DESC LIMIT 1;'
    break;
    case 'getCurrencyCrossRate':
      sql = 'select * from f_i_get_cross_rate_for_trade(${base},${quote},${date},${cross});';
    break;
    case 'getCurrencyRatesList':
      sql = 'SELECT quote_currency."CurrencyCode"||\'/\'||base_currency."CurrencyCode" as pair, id, base_code, base_currency."CurrencyCode" as base_iso, quote_code,quote_currency."CurrencyCode" as quote_iso , rate, rate_date::timestamp without time zone, rate_type, nominal,sourcecode,  round(1/rate,5) as inderect_rate '+
      'FROM public.dcurrencies_rates '+
      'left join "dCurrencies" AS base_currency ON base_currency."CurrencyCodeNum"=dcurrencies_rates.base_code '+
      'left join "dCurrencies" AS quote_currency ON quote_currency."CurrencyCodeNum"=dcurrencies_rates.quote_code ';
      sql +=conditionsCurrency.slice(0,-5) + 'ORDER BY id DESC;'
    break;
  }
  sql = pgp.as.format(sql,request.query);
  db_common_api.queryExecute(sql,response,undefined,request.query.dataType);
}
async function modifyRatesData (request,response) {
  let sql='';
  switch (request.body.params.dataType) {
    case 'deleteOldRateData':
      sql = 'DELETE FROM public.dcurrencies_rates '+
      'WHERE rate_date::timestamp without time zone = ${date} and sourcecode=ANY(array[${sourcecode}]) RETURNING * ;'
    break;
  }
  sql = pgp.as.format(sql,request.body.params);
  db_common_api.queryExecute(sql,response,undefined,request.body.params.dataType);
}

async function getCbrRateDaily (request,response) {
  let dateToLoad=request.query.date.split('-')
  dateToLoad = dateToLoad[2] +'/'+dateToLoad[1]+'/'+dateToLoad[0]
  let url='https://www.cbr.ru/scripts/XML_daily.asp?date_req='+dateToLoad
    https.get(url, (resp) => {
      let data = '';
      resp.on('error', (e) => console.log('err'));
      resp.on('data', (chunk) => data += chunk);
      resp.on('end', () =>  {
        let ind=data.indexOf("Date=")
        let dateToCheck =data.substring(ind+6,ind+16).split('.')
        dateToCheck = dateToCheck[2]+'/'+dateToCheck[1]+'/'+dateToCheck[0]
        console.log('date',data.substring(ind+6,ind+16))
        if (request.query.dataType==='getRatesDate') {
          return response.status(200).send({dateToCheck:dateToCheck})
        } 
        response.type('application/xml')
        sql = "INSERT INTO dcurrencies_rates (quote_code,rate_type,sourcecode,rate,base_code,nominal,rate_date) "+
        "with xmlCBR(x) as (values ('"+ data +"'::xml)) "+
        "SELECT  810 as quote_code, 1 as rate_type,'CurCBR',  "+
        "CAST(replace(CAST (unnest (xpath('//ValCurs/Valute/Value/text()', x)) as text),',','.') as numeric) AS rate, "+
        "CAST(CAST ( unnest (xpath('//ValCurs/Valute/NumCode/text()', x)) as text)as numeric) AS base_code , "+
        "CAST(CAST( unnest (xpath('//ValCurs/Valute/Nominal/text()', x))as text) as numeric) AS nominal ,  "+
        "TO_DATE(CAST ((xpath('//ValCurs/@Date', x))[1] as text),'DD.MM.YYYY') AS rate_date  "+
        "from xmlCBR RETURNING *;"
        db_common_api.queryExecute(sql,response,undefined,'insertCbrRateFromXML');
      })
    })
}
module.exports = {
  getCurrencyData,
  getCbrRateDaily,
  modifyRatesData
}