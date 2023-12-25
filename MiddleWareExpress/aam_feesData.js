const db_common_api = require('./db_common_api');
var pgp = require ('pg-promise')({capSQL:true});
const https = require('https');

async function geFeesData (request,response) {
  let sql='';
  let conditions = {}
  const query = {text: '', values:[]}
/*   conditions = {
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
  }); */
  switch (request.query.action) {
    case 'getManagementFeesCalcData':
      sql = `
      SELECT
        report_date,
        id_portfolio,
        portfolioname,
        SUM(management_fee_amount) AS management_fee_amount,
        npv,
        fee_code,`+
        'COALESCE(calculation_start,${p_report_date_start}) AS calculation_start,'+
        'COALESCE(calculation_end,${p_report_date_end}) AS calculation_end,'+
        `period_start,
        period_end,
        schedule_range,
        feevalue,
        fee_type_value
      FROM f_f_calc_management_fees(`
       +'${p_portfolios_list},${p_report_date_start},${p_report_date_end}'+
        `)
      GROUP BY
      GROUPING SETS (
        (
          report_date,
          id_portfolio,
          portfolioname,
          management_fee_amount,
          npv,
          fee_code,
          calculation_start,
          calculation_end,
          period_start,
          period_end,
          schedule_range,
          feevalue,
          fee_type_value
        ),
        (id_portfolio, portfolioname)
      )
    ORDER BY
      portfolioname,
      npv;`
    break;
  }
  sql = pgp.as.format(sql,request.query);
  db_common_api.queryExecute(sql,response,undefined,request.query.action);
}

module.exports = {
  geFeesData,
}