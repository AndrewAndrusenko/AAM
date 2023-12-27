const db_common_api = require('./db_common_api');
var pgp = require ('pg-promise')({capSQL:true});
const https = require('https');


async function fUpdateOrderData (request, response) {
  let fields = ['status']
 db_common_api.fUpdateTableDB ('dfees_transactions',fields,'id',request, response)
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
        SUM (fee_amount) AS fee_amount, 
        dfees_transactions.id, id_object, fee_object_type,  fee_date, calculation_date, b_transaction_date, id_b_entry, fee_rate, calculation_base, id_fee_main, fee_type,
        dportfolios.portfolioname,
        "dGeneralTypes"."typeDescription" AS fee_code
      FROM public.dfees_transactions
      LEFT JOIN dportfolios ON 
        dportfolios.idportfolio = dfees_transactions.id_object
      LEFT JOIN public."dGeneralTypes" ON 
        "dGeneralTypes"."typeValue"::numeric = dfees_transactions.fee_type AND "dGeneralTypes"."typeCode"='fee_type'`;
      sql +=conditionsFeesTransactions.length? conditionsFeesTransactions.slice(0,-5) : ''
      sql+=` 
      GROUP BY
      GROUPING SETS (
        (
          dfees_transactions.id, id_object, fee_object_type, fee_amount, fee_date, calculation_date, b_transaction_date, id_b_entry, fee_rate, calculation_base, id_fee_main, fee_type,
          dportfolios.portfolioname,
          "dGeneralTypes"."typeDescription" 
        ),
        (dportfolios.portfolioname, id_object)
      ) ;`
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
      portfolioname,
      npv;`
    break;
    case 'approvedManagementFeeCalc' :
      sql ='SELECT * FROM f_f_insert_management_fees(${p_portfolios_list},${p_report_date_start},${p_report_date_end});'
    break;
  }
  sql = pgp.as.format(sql,request.query);
  db_common_api.queryExecute(sql,response,undefined,request.query.action);
}

module.exports = {
  geFeesData,
  fUpdateOrderData
}