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
    case 'getCurrencyCodes':
      sql = 'SELECT  "CurrencyCodeNum","CurrencyCode","CurrencyName" FROM public."dCurrencies";'
    break;
    case 'getPairsList':
      sql = 'SELECT id, quote||\'/\'||base as pair, base, quote, nominal FROM public.dcurrencies_pairs;'
    break;
    case 'getCurrencyRate':
      sql = 'SELECT  base_code, id, quote_code, rate, rate_date::timestamp without time zone, rate_type FROM public.dcurrencies_rates ' +
      'WHERE base_code=${base} and quote_code=${quote} and rate_date <= ${date} ORDER by rate_date DESC LIMIT 1;'
    break;
    case 'getCurrencyRatesList':
      sql = 'SELECT quote_currency."CurrencyCode"||\'/\'||base_currency."CurrencyCode" as pair, id, base_code, base_currency."CurrencyCode" as base_iso, quote_code,quote_currency."CurrencyCode" as quote_iso , rate, rate_date::timestamp without time zone, rate_type, nominal,sourcecode '+
      'FROM public.dcurrencies_rates '+
      'left join "dCurrencies" AS base_currency ON base_currency."CurrencyCodeNum"=dcurrencies_rates.base_code '+
      'left join "dCurrencies" AS quote_currency ON quote_currency."CurrencyCodeNum"=dcurrencies_rates.quote_code ';
      sql +=conditionsCurrency.slice(0,-5) + 'ORDER BY id DESC;'
    break;
  }
  console.log('conditionsCurrency',sql);
  sql = pgp.as.format(sql,request.query);
  console.log('sql',sql);
  db_common_api.queryExecute(sql,response,undefined,request.query.dataType);
}
async function getCbrRateDaily (start) {
  let url='https://www.cbr.ru/scripts/XML_daily.asp?date_req=26/07/2023'
  console.log('url',url,start);
  return new Promise ((resolve) => {
    https.get(url, (resp) => {
      let data = '';
      resp.on('data', (chunk) => {data += chunk});
      resp.on('end', () => {
        console.log('data xml', data);
      })
    })
  })
}

module.exports = {
  getCurrencyData,
  getCbrRateDaily
}