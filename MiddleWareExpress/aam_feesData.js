const db_common_api = require('./db_common_api');
var pgp = require ('pg-promise')({capSQL:true});
async function fupdateFeesData (request, response) {
  let fields = ['fee_type', 'fee_code', 'fee_description', 'id_fee_period', 'fee_object_type']
 db_common_api.fUpdateTableDB ('dfees_main',fields,'id',request, response)
}
async function fupdateFeesTransactionsData (request, response) {
  let fields = ['fee_type', 'fee_code', 'fee_description', 'id_fee_period', 'id', 'fee_object_type']
 db_common_api.fUpdateTableDB ('dfees_transactions',fields,'id',request, response)
}
async function fupdatePortfoliosFeesData (request, response) {
  let fields = [ 'object_id', 'id_fee_main', 'period_start', 'period_end']
 db_common_api.fUpdateTableDB ('dfees_objects',fields,'id',request, response)
}
async function fupdateFeesScheduleData (request, response) {
  let fields = ['fee_type_value', 'feevalue', 'calculation_period', 'deduction_period', 'schedule_range', 'range_parameter', 'id_fee_main', 'pf_hurdle', 'highwatermark'  ]
  switch (request.body.action) {
    case 'Delete_Cascade':
      request.body.action='Delete';
      db_common_api.fUpdateTableDB ('dfees_schedules',fields,'id_fee_main',request, response);
    break;
    default:
      db_common_api.fUpdateTableDB ('dfees_schedules',fields,'idfee_scedule',request, response)
    break;
  }
}
async function fupdateFeesEntryInfo(request,response) {
  let sql = '';
  switch (request.body.params.action) {
    case 'updateFeesEntryInfo':
      sql = 'SELECT f_f_update_accounted_management_fees as qty FROM f_f_update_accounted_management_fees(${ids},${entry_id},${accounting_date});'
    break;
    case 'deleteMFAccounting':
      sql = 'SELECT * FROM f_f_remove_accounting_ref_management_fees(${entries_ids});'
    break;
  }
  sql = pgp.as.format(sql,request.body.params);
  db_common_api.queryExecute(sql,response,undefined,request.body.params.action);
} 
async function fgetTaxes (request,response) {
  let sql = "SELECT rate FROM public.a_taxes_rates WHERE code='profit_tax_rate' AND start_date<=${p_date};"
  sql = pgp.as.format(sql,request.query);
  db_common_api.queryExecute(sql,response,'fgetTaxes','fgetTaxes');
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
    case 'getFeesPortfoliosWithSchedulesData':
      sql='SELECT *,0 as action FROM f_f_get_portfolios_with_schedules(${p_object_id:raw},${p_id_fee_main})'
    break;
    case 'getFeesMainData':
      sql=`SELECT *,0 as action,'Portfolios' as portfolios FROM v_f_dfees_main`
    break;
    case 'getFeesMainWithSchedulesData':
      sql=`SELECT * FROM v_f_dfees_main_with_schedules`
    break;
    case 'getFeesSchedulesData':
      sql='SELECT *,0 as action FROM public.dfees_schedules WHERE id_fee_main = ${id_fee:raw} ORDER BY idfee_scedule;'
    break;
    case 'getPerformanceFeeCalcData':
      sql=`
      SELECT 
      * 
      FROM f_f_calc_performance_fees(`
        +"${p_portfolios_list},${p_report_date_hurdle},${p_report_date}"+
        `) 
      WHERE pos_pv>0
      ORDER BY portfolioname;`
    break;
    case 'getFeesPerformanceTransactions':
      sql=`
      SELECT 
        fee_amount, "accountId" ,id_object,
        ft_main.id, fee_object_type,  fee_date, calculation_date, b_transaction_date, id_b_entry1, fee_rate, calculation_base, id_fee_main, fee_type,
        dportfolios.portfolioname,
        "dGeneralTypes"."typeDescription" AS fee_code,pl, ft_hwm.hwm
      FROM public.dfees_transactions AS ft_main
      LEFT JOIN dportfolios ON 
        dportfolios.idportfolio = ft_main.id_object
      LEFT JOIN "bAccounts" ON
        dportfolios.idportfolio = "bAccounts".idportfolio AND "bAccounts"."accountTypeExt"=8
      LEFT JOIN public."dGeneralTypes" ON 
        "dGeneralTypes"."typeValue"::numeric = ft_main.fee_type AND "dGeneralTypes"."typeCode"='fee_type'
      LEFT JOIN LATERAL (
        SELECT hwm FROM public.dfees_transactions
        WHERE dfees_transactions.id_object=ft_main.id_object AND
        dfees_transactions.fee_type=2 AND
        dfees_transactions.fee_date<ft_main.fee_date
        ORDER BY dfees_transactions.fee_date DESC
        LIMIT 1
      ) AS ft_hwm ON TRUE
      WHERE ft_main.fee_type=2 `;
      sql +=conditionsFeesTransactions.length? conditionsFeesTransactions.slice(0,-5).replace('WHERE','AND') :'';
    break;
    case 'getFeesManagementTransactions':
      sql=`
      SELECT 
        SUM (fee_amount) AS fee_amount, "accountId" ,id_object,
        MIN(fee_date) as "startPeriod", MAX(fee_date) as "endPeriod",
        dfees_transactions.id, fee_object_type,  fee_date, calculation_date, b_transaction_date, id_b_entry1, fee_rate, calculation_base, id_fee_main, fee_type,
        dportfolios.portfolioname,
        "dGeneralTypes"."typeDescription" AS fee_code
      FROM public.dfees_transactions
      LEFT JOIN dportfolios ON 
        dportfolios.idportfolio = dfees_transactions.id_object
      LEFT JOIN "bAccounts" ON
        dportfolios.idportfolio = "bAccounts".idportfolio AND "bAccounts"."accountTypeExt"=8
      LEFT JOIN public."dGeneralTypes" ON 
        "dGeneralTypes"."typeValue"::numeric = dfees_transactions.fee_type AND "dGeneralTypes"."typeCode"='fee_type'
      WHERE dfees_transactions.fee_type=1 `;
      sql +=conditionsFeesTransactions.length? conditionsFeesTransactions.slice(0,-5).replace('WHERE','AND') : ''
      sql+=` 
      GROUP BY
      GROUPING SETS (
        (
          dfees_transactions.id, id_object, fee_object_type, fee_amount, fee_date, calculation_date, b_transaction_date, id_b_entry1, fee_rate, calculation_base, id_fee_main, fee_type,
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
    case 'approvedPerformanceFeeCalc' :
      sql ='SELECT * FROM f_f_insert_performance_fees(${p_portfolios_list},${p_report_date});'
    break;
    case 'checkFeesTransWithEntries':
      sql ='SELECT id FROM public.dfees_transactions WHERE id = ANY(${ids_fees}) AND id_b_entry1 notnull;'
      request.query.ids_fees =typeof(request.query.ids_fees)==='string'? [Number(request.query.ids_fees)] : request.query.ids_fees.map(el=>Number(el))
    break;
  }
  sql = pgp.as.format(sql,request.query);
  sql = sql.replaceAll("'null'",null);
  console.log(request.query)
  db_common_api.queryExecute(sql,response,undefined,request.query.action);

}
module.exports = {
  geFeesData,
  fupdateFeesData,
  fupdateFeesScheduleData,
  fupdateFeesEntryInfo,
  fupdatePortfoliosFeesData,
  fupdateFeesTransactionsData,
  fgetTaxes
}