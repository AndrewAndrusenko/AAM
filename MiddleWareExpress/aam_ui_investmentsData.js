const config = require ('./db_config');
const db_common_api = require ('./db_common_api')
var pgp = require ('pg-promise')({capSQL:true});
async function fGetStrategiesList (request,response) {
  const query = {text: 'SELECT id, sname as Name, s_level_id as Level, s_description as Description, s_benchmark_account, dportfolios.portfolioname as "Benchmark Account", 0 as action ' +
	' FROM public.dstrategiesglobal LEFT JOIN public.dportfolios ' + 
  ' ON dportfolios.idportfolio = dstrategiesglobal.s_benchmark_account'}
  switch (request.query.action) {
    case 'Check_Name':
      request.query.id = (request.query.id == '') ? 0 : request.query.id 
      query.text += ' WHERE UPPER(sname) = UPPER($1) AND id != $2;'
      query.values = [request.query.Name, request.query.id]
    break;
    case 'Get_Strategy_Data':
      query.text = 'SELECT id, sname, s_level_id, s_description, s_benchmark_account, dportfolios.portfolioname as "Benchmark Account", 0 as action  FROM public.dstrategiesglobal LEFT JOIN public.dportfolios ' + 
      ' ON dportfolios.idportfolio = dstrategiesglobal.s_benchmark_account WHERE (id= $1); '
      query.values = [request.query.id]
      request.query.action='Get_Strategy_Data'
    break;
    case 'Get_ModelPortfolios_List' :
      query.text += ' WHERE (s_level_id = 1) ORDER BY sname;'
    break;
    case 'Get_Strategies_List' :
      query.text += ' WHERE (s_level_id = 2) ORDER BY sname;'
    break;
    case 'Get_AccountTypes_List' :
      query.text = 'SELECT "typeCode", "typeValue", "typeDescription" ' + 
                   'FROM public."dGeneralTypes" '+ 
                   'WHERE ("typeCode" = $1) ORDER BY  "typeValue"'
      query.values = ['account_type']
    break;
    default:
      query.text += ' ORDER BY s_level_id, sname ;'
      request.query.action==='undefined'? request.query.action = 'fGetStrategiesList':null
    break;
  }
  sql = pgp.as.format(query.text,query.values)
  db_common_api.queryExecute (sql, response,null,request.query.action==='undefined'? 'fGetStrategiesList':request.query.action);
}
async function fGetStrategyStructure (request,response) {
  const query = {text: 'SELECT '+
    ' id_strategy_parent, id_strategy_child as id, dstrategiesglobal.sname, dstrategiesglobal.s_description as description,  ' +
    ' mmoexsecurities.isin, mmoexsecurities.name, '+ 
    ' weight_of_child, dstrategies_global_structure.id as id_item , weight_of_child as old_weight' + 
    ' FROM public.dstrategies_global_structure LEFT JOIN	dstrategiesglobal ' +
    ' ON dstrategiesglobal.id::text = dstrategies_global_structure.id_strategy_child	' +
    ' LEFT JOIN mmoexsecurities ON mmoexsecurities.secid = dstrategies_global_structure.id_strategy_child '+
    ' WHERE id_strategy_parent = $1'}
    query.values = [Number(request.query.id)] 
  switch (request.query.action) {
    case 'Check_Name':
      query.text += ' WHERE ((sname) = $1) AND ((id) != $2);'
      query.values = [request.query.Name, request.query.id]
    break;
    case 'Get_Strategy_Data':
      query.text += ' WHERE (id= $1) ORDER BY secid, sname ;'
      query.values = [request.query.id]
    break;
    case 'getModelPortfolios':
      query.text = 'SELECT * FROM dstrategiesglobal ORDER BY s_level_id, sname ;'
      query.values = [request.query.id]
    break;
    case 'getPortfoliosByMP_StrtgyID':
      if (request.query.Name==='All') {
        query.text = 'select ARRAY_AGG(portfolioname) from public.dportfolios;'
      } else {
      query.text = 'select ARRAY_AGG(portfolioname) from f_i_get_portfolios_list_by_strategy($1);'
      query.values = [request.query.Name]
      }
    break;
    case 'getStrategyStructureHistory':
      query.text='SELECT * FROM f_i_h_get_dstrategies_global_structure_history(null,${p_id_strategy_parent},null,null);'
      query.values=request.query
    break;
    default:
      query.text += ';'
    break;
  }
  sql = pgp.as.format(query.text,query.values)
  db_common_api.queryExecute (sql, response,null,'fGetStrategyStructure');
}
async function fStrategyDataUpdate (request, response) {
  let fields = ['sname','s_level_id','s_description','s_benchmark_account']
  db_common_api.fUpdateTableDB ('dstrategiesglobal',fields,'id',request, response,[])
}
async function fStrategyStructureUpdate (request, response) {
  request.body.data.id=request.body.data.id_item
  let fields = ['id_strategy_parent','id_strategy_child_integer','weight_of_child','id_strategy_child','user_id']
 db_common_api.fUpdateTableDB ('dstrategies_global_structure',fields,'id',request, response,[])
}
async function fAccountEdit (request, response) {
  let fields = ['idclient', 'idstategy', 'portfolioname', 'portleverage','user_id']
  db_common_api.fUpdateTableDB ('dportfolios',fields,'idportfolio',request, response)
}
async function fGetPortfolioPositions (request,response) {
  let conditionsDic = {
    'secidList':' LOWER(deviats.secid) = ANY(${secidList}) ',
    'deviation':' (ABS(order_amount/notnull_npv*100) > ${deviation}::numeric OR mtm_dirty_price ISNULL)',
    }
  let conditions =' WHERE'
  Object.entries(conditionsDic).forEach(([key]) => {
  if  (request.body.params.hasOwnProperty(key)&&request.body.params[key]) {
    conditions +=conditionsDic[key] + ' AND ';
    }
  });
  let sql = '';
  switch (request.body.action) {
    case 'getPortfolioPositions':
      sql= `
        SELECT 1 as set_number, round(order_amount/notnull_npv*100,2) AS deviation_percent,(npv!=0) AS not_zero_npv, * 
        FROM f_i_get_portfolios_structure_detailed_data`+'(${idportfolios},${report_date},${report_id_currency})'+` 
        UNION
        SELECT 2 as set_number, 
        0,true,account_currency,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,
        fee_amount AS total_pl,
        idportfolio,
        portfolioname,
        CASE
        WHEN transaction_type=14 THEN 'Management Fees'
        WHEN transaction_type=16 THEN 'Performance Fees'
        ELSE 'Other Fees'
        END
        ,NULL,NULL,NULL,0,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL
        FROM f_i_get_deducted_fees_per_portfolios_on_date`+'(${idportfolios},${report_date})'+`
        WHERE "accountNo" isnull AND transaction_type notnull
        ORDER BY set_number,mp_id,secid,portfolio_code`
    break;
    case 'getPortfolioMpDeviations':
      sql= 'SELECT deviats.*, '+
          'round(order_amount/notnull_npv*100,2) as deviation_percent,(deviats.npv!=0) as not_zero_npv, '+
          ' orders.order_amount_final,deviats.order_amount - COALESCE(orders.order_amount_final,0) as ord_diff '+
          'FROM f_i_get_portfolios_structure_detailed_data(${idportfolios},${report_date},${report_id_currency}) deviats '+
          'LEFT JOIN (SELECT * FROM f_i_o_prepare_orders_data_by_mp_v3(${leverage},${idportfolios},${secidList},${report_date},${report_id_currency},${deviation})) orders '+
          'ON orders.id_portfolio = deviats.idportfolio AND orders.secid = deviats.secid '
      sql += conditions.slice(0,-5) +' ORDER BY deviats.secid,deviats.portfolio_code;'
    break;
  }
  sql = pgp.as.format(sql,request.body.params);
  db_common_api.queryExecute(sql,response,undefined,request.body.action);
}
async function fGetPortfolioAnalytics (request,response) {
  let conditionsDic = {
    'secidList':' LOWER(secid) = ANY(${secidList}) ',
    'deviation':' ABS(order_amount/notnull_npv*100) > ${deviation}::numeric ',
    }
  let conditions =' WHERE'
  let sql = '';
  switch (request.body.action) {
    case 'getPortfolioPerformnceData':
      sql= 'SELECT * FROM public.f_i_get_npv_dynamic_with_perfomance_twroi (${p_portfolios_list },${p_report_date_start}, ${p_report_date_end}, ${p_report_currency}) ' 
      sql += conditions.slice(0,-5) + request.body.order? 'ORDER BY' + request.body.order +';' :';'
    break;
    case 'getNPVDynamic':
      sql= 'SELECT * FROM public.f_i_get_npv_dynamic (${p_portfolios_list },${p_report_date_start}, ${p_report_date_end}, ${p_report_currency},null) ' 
      sql += conditions.slice(0,-5) + request.body.order? 'ORDER BY' + request.body.order +';' :';'
    break;
    case 'getRevenueFactorData':
      sql= 'SELECT * FROM public.f_i_get_pl_dynamic_with_npv (${p_report_date_start}, ${p_report_date_end},${p_portfolios_list}, ${p_report_currency}) ' 
      sql += conditions.slice(0,-5) + request.body.order? 'ORDER BY' + request.body.order +';' :';'
    break;
  }
  sql = pgp.as.format(sql,request.body.params);
  db_common_api.queryExecute(sql,response,undefined,request.body.action);
}
module.exports = {
  fGetStrategiesList,
  fStrategyDataUpdate,
  fGetStrategyStructure,
  fStrategyStructureUpdate,
  fAccountEdit,
  fGetPortfolioPositions,
  fGetPortfolioAnalytics
}