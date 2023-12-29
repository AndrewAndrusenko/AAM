const db_common_api = require('./db_common_api');
var pgp = require ('pg-promise')({capSQL:true});
const https = require('https');


async function fUpdateOrderData (request, response) {
  let fields = ['status']
 db_common_api.fUpdateTableDB ('dfees_transactions',fields,'id',request, response)
}
async function fupdateFeesEntryInfo(request,response) {
  let sql = '';
  console.log('query',request.body);
  switch (request.body.params.action) {
    case 'updateFeesEntryInfo':
      sql = 'SELECT f_f_update_accounted_management_fees as qty FROM f_f_update_accounted_management_fees(${ids},${entry_id});'
    break;
  }
  sql = pgp.as.format(sql,request.body.params);
  console.log('sql',sql);
  db_common_api.queryExecute(sql,response,undefined,request.body.params.action);

} 

async function fgetTaxes (request,response) {
  let sql = "SELECT rate FROM public.a_taxes_rates WHERE code='profit_tax_rate' AND start_date<=${p_date};"
  sql = pgp.as.format(sql,request.query);
  db_common_api.queryExecute(sql,response,'fgetTaxes',request.query.action);
}
async function geFeesData (request,response) {
  let sql='';
  let conditions = {}
  const query = {text: '', values:[]}
  conditions = {
    'p_portfolios_list':{
      1: '(dportfolios.portfolioname= ANY(array[${p_portfolios_list}]))',
    },
    'p_report_date_start': {
      1: '(fee_date >= ${p_report_date_start}::date )',
    },
    'p_report_date_end': {
      1: '(fee_date <= ${p_report_date_end}::date) ',
    }
  }
  let conditionsFeesTransactions =' WHERE'
  Object.entries(conditions).forEach(([key,value]) => {
  if  (request.query.hasOwnProperty(key)) {
    query.values.push(request.query[key]);
    conditionsFeesTransactions +=conditions[key][1] + ' AND ';
    }
  });
  switch (request.query.action) {
    case 'getFeesTransactions':
      sql=`
      SELECT 
        SUM (fee_amount) AS fee_amount, "accountId" ,id_object,
        MIN(fee_date) as "startPeriod", MAX(fee_date) as "endPeriod",
        dfees_transactions.id, fee_object_type,  fee_date, calculation_date, b_transaction_date, id_b_entry, fee_rate, calculation_base, id_fee_main, fee_type,
        dportfolios.portfolioname,
        "dGeneralTypes"."typeDescription" AS fee_code
      FROM public.dfees_transactions
      LEFT JOIN dportfolios ON 
        dportfolios.idportfolio = dfees_transactions.id_object
      LEFT JOIN "bAccounts" ON
        dportfolios.idportfolio = "bAccounts".idportfolio AND "bAccounts"."accountTypeExt"=8
      LEFT JOIN public."dGeneralTypes" ON 
        "dGeneralTypes"."typeValue"::numeric = dfees_transactions.fee_type AND "dGeneralTypes"."typeCode"='fee_type'`;
      sql +=conditionsFeesTransactions.length? conditionsFeesTransactions.slice(0,-5) : ''
      sql+=` 
      GROUP BY
      GROUPING SETS (
        (
          dfees_transactions.id, id_object, fee_object_type, fee_amount, fee_date, calculation_date, b_transaction_date, id_b_entry, fee_rate, calculation_base, id_fee_main, fee_type,
          dportfolios.portfolioname,
          "dGeneralTypes"."typeDescription",
          "bAccounts"."accountId"
        ),
        (dportfolios.portfolioname, id_object,fee_type,"accountId")
      ) 
      ORDER BY
      calculation_base NULLS FIRST,
      portfolioname;`
    break;
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
        fee_type_value,
        id_fee_transaction
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
          fee_type_value,
          id_fee_transaction
        ),
        (id_portfolio, portfolioname)
      )
    ORDER BY
      npv NULLS FIRST,
      portfolioname;`
    break;
    case 'approvedManagementFeeCalc' :
      sql ='SELECT * FROM f_f_insert_management_fees(${p_portfolios_list},${p_report_date_start},${p_report_date_end});'
    break;
    case 'checkFeesTransWithEntries':
      sql ='SELECT id FROM public.dfees_transactions WHERE id = ANY(${ids_fees}) AND id_b_entry>0;'
      request.query.ids_fees = request.query.ids_fees.map(el=>Number(el))
    break;
  }
  sql = pgp.as.format(sql,request.query);
  db_common_api.queryExecute(sql,response,undefined,request.query.action);
}

module.exports = {
  geFeesData,
  fUpdateOrderData,
  fupdateFeesEntryInfo,
  fgetTaxes
}