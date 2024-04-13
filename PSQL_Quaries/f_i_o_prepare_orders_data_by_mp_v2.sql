-- FUNCTION: public.f_i_o_prepare_orders_data_by_mp_v2(integer, text[], text[], date, integer, numeric)

-- DROP FUNCTION IF EXISTS public.f_i_o_prepare_orders_data_by_mp_v2(integer, text[], text[], date, integer, numeric);

CREATE OR REPLACE FUNCTION public.f_i_o_prepare_orders_data_by_mp_v2(
	p_leverage_handle integer,
	p_portfolio_code text[],
	p_secid_list text[],
	p_report_date date,
	p_report_currency integer,
	p_min_deviation numeric)
    RETURNS TABLE(order_amount_main numeric, balance_net numeric, balance_net_with_orders numeric, order_at_max_limit numeric, mp_leverage_good boolean, npv numeric, mp_npv numeric, mp_weight numeric, balance_corrected_by_mp numeric, orders_net_amount_rt numeric, net_orders numeric, portfolio_code character varying, portfolio_leverage_by_mp numeric, mp_leverage_weight numeric, leverage_amount numeric, leverage_handle integer, leverage numeric, balance numeric, id bigint, generated date, order_type numeric, idcurrency numeric, child_orders integer[], mp_id bigint, qty numeric, price numeric, amount numeric, qty_executed numeric, parent_order integer, id_portfolio numeric, type character varying, secid character varying, status character varying, ordertype character varying) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
DECLARE 
opposite_orders text[];
BEGIN
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
  mtm_positon
FROM f_i_get_portfolios_structure_detailed_data (p_portfolio_code, p_report_date, p_report_currency);

SELECT
  ARRAY_AGG(CONCAT(dportfolios.portfolioname,' ',new_orders.secid,' ', new_orders."type",'. Opposite order:', dorders.id)) INTO opposite_orders
FROM new_orders
  LEFT JOIN dorders ON new_orders.secid = dorders.secid
  AND new_orders.id_portfolio = dorders.id_portfolio
  AND (
    CASE
      WHEN new_orders."type" = 'SELL' THEN 'BUY'
      ELSE 'SELL'
    END
  ) = dorders.type
LEFT JOIN dportfolios ON dportfolios.idportfolio = new_orders.id_portfolio
WHERE
 LOWER(new_orders.secid) = ANY (p_secid_list) AND
  dorders.status != 'accounted';

IF ARRAY_LENGTH(opposite_orders, 1) > 0 THEN 
  RAISE EXCEPTION 'There are active opposite orders for the following  %',opposite_orders;
END IF;

RETURN QUERY
WITH 
npv_by_mp AS (
	SELECT new_orders.id_portfolio,mp_name, SUM(mtm_positon) AS mp_npv FROM new_orders GROUP BY new_orders.id_portfolio,mp_name ),
unnaccounted_orders AS (
	SELECT 	nor.id_portfolio, SUM(CASE WHEN nor.type = 'BUY' THEN nor.unaccounted_amount*-1 ELSE nor.unaccounted_amount END) AS net_orders
	FROM f_i_o_get_orders_unaccounted_qty(ARRAY(SELECT DISTINCT new_orders.id_portfolio FROM new_orders),null) as nor
	GROUP BY nor.id_portfolio),
main_set AS (
	SELECT 
	CASE WHEN leverage_restrictions.mp_leverage_weight<= leverage_restrictions.portfolio_leverage_by_mp THEN true ELSE false END AS mp_leverage_good,
		balances.npv,
		npv_by_mp.mp_npv,
		leverage_restrictions.mp_weight,
		LEAST(orders.npv*leverage_restrictions.mp_weight/100 - npv_by_mp.mp_npv,balances.amount)::numeric(20,2) AS balance_corrected_by_mp,
		(SUM( CASE WHEN orders."type" = 'BUY' THEN orders.amount*-1 ELSE orders.amount END) 
			OVER (PARTITION BY orders.id_portfolio
			ORDER BY orders.id_portfolio, orders."type" DESC, orders.amount 
			ROWS BETWEEN UNBOUNDED PRECEDING  AND CURRENT ROW
		)) AS orders_net_amount_rt,
		COALESCE(unacc_orders.net_orders,0) ::numeric(20,2) as net_orders,
		balances.portfolio_code,
		leverage_restrictions.portfolio_leverage_by_mp,
		leverage_restrictions.mp_leverage_weight,
		ROUND(leverage_restrictions.portfolio_leverage_by_mp/100*balances.npv,2) as leverage_amount,
		p_leverage_handle as leverage_handle, leverage_restrictions.leverage_restrction as leverage,	
		balances.amount as balance,
		1::bigint,orders.generated, orders.order_type,orders.idcurrency,orders.child_orders,orders.mp_id,orders.qty,orders.price, orders.amount,  orders.qty_executed,
		 orders.parent_order, orders.id_portfolio,orders.type,   orders.secid,    orders.status, orders.ordertype
	FROM  new_orders orders
	LEFT JOIN LATERAL (
		SELECT new_orders.amount, new_orders.npv,new_orders.weight,new_orders.portfolio_code from new_orders where LEFT(new_orders.secid,5)='MONEY'
		AND new_orders.id_portfolio=orders.id_portfolio
	) balances ON TRUE
-- 				id int,code char varying,"type" text,"group" text,portfolio_restriction_by_mp numeric,sum_weight numeric,mp_id int,mp_name character varying,
-- 			mp_object_weight numeric,restriction_rate numeric
	LEFT JOIN LATERAL (
		SELECT   rt.mp_id,rt.mp_name,rt.mp_weight,rt.portfolio_restriction_by_mp as portfolio_leverage_by_mp ,
		rt. mp_object_weight as mp_leverage_weight,rt.restriction_rate as leverage_restrction
		FROM f_i_r_get_restrictions (
		ARRAY(SELECT DISTINCT new_orders.id_portfolio FROM new_orders)) rt
		WHERE rt.id=orders.id_portfolio AND rt.mp_id=orders.mp_id AND rt.rest_type='cash'
	) leverage_restrictions ON TRUE
	LEFT JOIN LATERAL (
		SELECT * FROM unnaccounted_orders
		WHERE unnaccounted_orders.id_portfolio = orders.id_portfolio
	) unacc_orders ON TRUE
	LEFT JOIN LATERAL (SELECT * FROM npv_by_mp WHERE npv_by_mp.mp_name=orders.mp_name AND npv_by_mp.id_portfolio=orders.id_portfolio) npv_by_mp ON TRUE
	WHERE
		(p_secid_list ISNULL OR LOWER(orders.secid) = ANY (p_secid_list) )
		AND (ABS(orders.amount / orders.notnull_npv * 100) > p_min_deviation OR orders.price ISNULL)
		AND orders.type NOTNULL
-- 	AND LEFT(orders.secid,5)!='MONEY'
	
),
main_set_with_maxlimit AS (
	SELECT 
		(main_set.net_orders + main_set.balance_corrected_by_mp + main_set.leverage_amount) AS balance_net,
		(main_set.net_orders + main_set.balance_corrected_by_mp + main_set.leverage_amount + main_set.orders_net_amount_rt) AS balance_net_with_orders,
		CASE 
			WHEN main_set."type"='SELL' THEN main_set.amount
			WHEN (main_set.net_orders + main_set.balance_corrected_by_mp + main_set.leverage_amount + main_set.orders_net_amount_rt)>0
			THEN main_set.amount
			ELSE 
				CASE 
				WHEN (main_set.net_orders + main_set.balance_corrected_by_mp + main_set.leverage_amount + main_set.orders_net_amount_rt +main_set.amount)<0
				THEN 0
				ELSE 
					ROUND((
						FLOOR(main_set.net_orders + main_set.balance_corrected_by_mp + main_set.leverage_amount + main_set.orders_net_amount_rt +main_set.amount)/main_set.price)*main_set.price,2)
				END
		END AS order_at_max_limit,
		*
	FROM main_set
) 
SELECT 
	CASE 
		WHEN p_leverage_handle = 0 THEN main_set_with_maxlimit.amount
		WHEN p_leverage_handle = 1 THEN CASE WHEN main_set_with_maxlimit.mp_leverage_good=true THEN main_set_with_maxlimit.amount ELSE 0 END
		WHEN p_leverage_handle = 2 THEN main_set_with_maxlimit.order_at_max_limit
	END AS order_amount_main,
* FROM main_set_with_maxlimit
WHERE (	
	CASE 
		WHEN p_leverage_handle = 0 THEN main_set_with_maxlimit.amount
		WHEN p_leverage_handle = 1 THEN CASE WHEN main_set_with_maxlimit.mp_leverage_good=true THEN main_set_with_maxlimit.amount ELSE 0 END
		WHEN p_leverage_handle = 2 THEN main_set_with_maxlimit.order_at_max_limit
	END
	*100/main_set_with_maxlimit.npv)>p_min_deviation OR main_set_with_maxlimit.price isnull
;
END;
$BODY$;

ALTER FUNCTION public.f_i_o_prepare_orders_data_by_mp_v2(integer, text[], text[], date, integer, numeric)
    OWNER TO postgres;
select 
secid,
amount,order_amount_main-amount,* from f_i_o_prepare_orders_data_by_mp_v2(
	2,array[
		'acm002',
		'acm002'],
	array['clearall','aapl-rm''nflx-rm','ri100000bf4','ri100000br4','rim4','spot-rm','aapl-rm']
	,now()::date,840,1)