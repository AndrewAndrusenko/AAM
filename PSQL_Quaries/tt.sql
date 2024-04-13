CREATE TEMP TABLE
  new_orders ON
COMMIT
DROP AS
SELECT
  1::bigint,
  NOW()::date AS generated,
  f_i_get_portfolios_structure_detailed_data.order_type::CHARACTER VARYING AS
  type,
  f_i_get_portfolios_structure_detailed_data.secid,
  order_qty AS qty,
  mtm_dirty_price AS price,
  CASE 
  WHEN LEFT(f_i_get_portfolios_structure_detailed_data.secid,5) = 'MONEY' THEN f_i_get_portfolios_structure_detailed_data.current_balance
  ELSE ABS(order_amount)
  END
  AS amount,
  0::NUMERIC AS qty_executed,
  'created'::CHARACTER VARYING AS status,
  NULL::INT AS parent_order,
  idportfolio::NUMERIC AS id_portfolio,
  0::NUMERIC AS order_type,
  report_currency::NUMERIC AS idcurrency,
  NULL::INT[] AS child_orders,
  'Client'::CHARACTER VARYING AS ordertype,
  f_i_get_portfolios_structure_detailed_data.mp_id::BIGINT,
  notnull_npv,
  f_i_get_portfolios_structure_detailed_data.npv,
  weight,
  f_i_get_portfolios_structure_detailed_data.portfolio_code,
  mp_name,
  mtm_positon,
	ms.group,
	COALESCE(ms.type,'-') AS sec_type,
	COALESCE(ms.listing,0) AS listing,
	current_balance
FROM f_i_get_portfolios_structure_detailed_data (array['vpc005'], now()::date, 840)
LEFT JOIN public.mmoexsecurities ms ON ms.secid = f_i_get_portfolios_structure_detailed_data.secid;

WITH 
npv_by_rs_type AS (
	SELECT 
		new_orders.id_portfolio,new_orders.sec_type,new_orders.listing, SUM(mtm_positon) AS mtm_positon 
	FROM new_orders 
	GROUP BY 
	GROUPING SETS(
		(new_orders.id_portfolio,new_orders.sec_type),
		(new_orders.id_portfolio,new_orders.listing),
		(new_orders.id_portfolio))
),
npv_by_mp AS (
	SELECT new_orders.id_portfolio,mp_name, SUM(mtm_positon) AS mp_npv FROM new_orders GROUP BY new_orders.id_portfolio,mp_name )
	SELECT 	
		nor.id_portfolio, new_orders.secid, new_orders.sec_type, new_orders.listing,
		SUM(CASE WHEN nor.type = 'BUY' THEN nor.unaccounted_amount ELSE nor.unaccounted_amount*-1 END)::numeric(20,2) AS net_orders
	FROM f_i_o_get_orders_unaccounted_qty(ARRAY(SELECT DISTINCT new_orders.id_portfolio FROM new_orders),null) as nor
	LEFT JOIN (SELECT DISTINCT new_orders.secid,new_orders.sec_type,new_orders.listing FROM new_orders) new_orders ON new_orders.secid = nor.secid
	GROUP BY
	GROUPING SETS
	(
		(nor.id_portfolio,new_orders.sec_type),
		(nor.id_portfolio,new_orders.listing),
		(nor.id_portfolio,new_orders.secid),
		(nor.id_portfolio,new_orders.listing,new_orders.secid)
	)