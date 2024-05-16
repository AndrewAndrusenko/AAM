-- FUNCTION: public.f_i_o_prepare_orders_data_by_mp_v3(integer, text[], text[], date, integer, numeric)

-- DROP FUNCTION IF EXISTS public.f_i_o_prepare_orders_data_by_mp_v3(integer, text[], text[], date, integer, numeric);

CREATE OR REPLACE FUNCTION public.f_i_o_prepare_orders_data_by_mp_v3(
	p_leverage_handle integer,
	p_portfolio_code text[],
	p_secid_list text[],
	p_report_date date,
	p_report_currency integer,
	p_min_deviation numeric)
    RETURNS TABLE(order_amount_final numeric, order_at_max_limit numeric, balance_corrected_by_mp numeric, leverage_amount numeric, lv_corr numeric, total_net_orders numeric, mp_leverage_good boolean, balance numeric, orders_net_amt_rt numeric, mp_weight numeric, order_amount_main numeric, order_rs_secid numeric, order_rs_sec_type numeric, order_rs_listing numeric, mp_restriction_good boolean, npv numeric, mp_npv numeric, npv_sec_type numeric, npv_listing numeric, orders_net_amount_rt_sec_type numeric, orders_net_amount_rt_listing numeric, net_orders_sec_type numeric, net_orders_listing numeric, net_orders_secid numeric, portfolio_code character varying, mp_object_weight numeric, portfolio_restriction_by_mp numeric, rs_amount_sec_type numeric, rs_amount_listing numeric, leverage_handle integer, rs_sec_type numeric, rs_secid numeric, rs_listing numeric, secid_balance numeric, id bigint, generated date, order_type numeric, idcurrency numeric, child_orders integer[], mp_id bigint, qty numeric, price numeric, amount numeric, qty_executed numeric, parent_order integer, id_portfolio numeric, type character varying, secid character varying, status character varying, ordertype character varying, sec_type text, listing numeric) 
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
  mtm_positon,
	ms.group,
	COALESCE(ms.type,'-') AS sec_type,
	COALESCE(ms.listing,0) AS listing,
	current_balance
FROM f_i_get_portfolios_structure_detailed_data (p_portfolio_code, p_report_date, p_report_currency)
LEFT JOIN public.mmoexsecurities ms ON ms.secid = f_i_get_portfolios_structure_detailed_data.secid;

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
	SELECT new_orders.id_portfolio,mp_name, SUM(mtm_positon) AS mp_npv FROM new_orders GROUP BY new_orders.id_portfolio,mp_name ),
unnaccounted_orders AS (
	SELECT 	
		nor.id_portfolio, new_orders.secid, new_orders.sec_type, new_orders.listing,new_orders.mp_id,
		SUM(CASE WHEN nor.type = 'BUY' THEN nor.unaccounted_amount ELSE nor.unaccounted_amount*-1 END) AS net_orders
	FROM f_i_o_get_orders_unaccounted_qty(ARRAY(SELECT DISTINCT new_orders.id_portfolio FROM new_orders),null) as nor
	LEFT JOIN (SELECT DISTINCT new_orders.secid,new_orders.sec_type,new_orders.listing,new_orders.mp_id FROM new_orders) new_orders ON new_orders.secid = nor.secid
	GROUP BY
	GROUPING SETS
	(
		(nor.id_portfolio,new_orders.sec_type),
		(nor.id_portfolio,new_orders.listing),
		(nor.id_portfolio,new_orders.secid),
		(nor.id_portfolio,new_orders.mp_id)
	)
),
main_set AS (
	SELECT 
		CASE WHEN sec_type_restrictions.portfolio_restriction_by_mp>= sec_type_restrictions.mp_object_weight THEN true ELSE false END AS  mp_restriction_good,
		orders.npv,
		npv_by_mp.mp_npv,
		npv_sec_type.npv_sec_type,
		npv_listing.npv_listing,
		SUM( CASE WHEN orders."type" = 'BUY' THEN orders.amount ELSE orders.amount*-1 END) 
			OVER (PARTITION BY orders.id_portfolio,orders.sec_type
			ORDER BY orders.id_portfolio, orders.sec_type,orders."type" DESC, orders.amount 
			ROWS BETWEEN UNBOUNDED PRECEDING  AND CURRENT ROW
		) AS orders_net_amount_rt_sec_type,
		SUM( CASE WHEN orders."type" = 'BUY' THEN orders.amount ELSE orders.amount*-1 END) 
			OVER (PARTITION BY orders.id_portfolio,orders.listing
			ORDER BY orders.id_portfolio, orders.listing,orders."type" DESC, orders.amount 
			ROWS BETWEEN UNBOUNDED PRECEDING  AND CURRENT ROW
		) AS orders_net_amount_rt_listing,
	
		COALESCE(sc_unacc_orders.net_orders,0) ::numeric(20,2) as net_orders_sec_type,
		COALESCE(ls_unacc_orders.net_orders,0) ::numeric(20,2) as net_orders_listing,
		COALESCE(sec_unacc_orders.net_orders,0) ::numeric(20,2) as net_orders_secid,
		orders.portfolio_code,
		sec_type_restrictions.mp_object_weight,
		sec_type_restrictions.portfolio_restriction_by_mp,
		ROUND(COALESCE(sec_type_restrictions.portfolio_restriction_by_mp,200)/100*orders.npv,2) as rs_amount_sec_type,
		ROUND(COALESCE(listing_restrictions.portfolio_restriction_by_mp,200)/100*orders.npv,2) as rs_amount_listing,
	
		p_leverage_handle as leverage_handle, 
		sec_type_restrictions.portfolio_restriction_by_mp AS rs_sec_type,	
		secid_restrictions.portfolio_restriction_by_mp AS rs_secid,
		listing_restrictions.portfolio_restriction_by_mp AS rs_listing,
		COALESCE(mtm_positon,0) AS secid_balance,
	
		1::bigint,orders.generated, orders.order_type,orders.idcurrency,orders.child_orders,orders.mp_id,orders.qty,orders.price, orders.amount,  orders.qty_executed,
		orders.parent_order, orders.id_portfolio,orders.type,   orders.secid,    orders.status, orders.ordertype,
		orders.sec_type, orders.listing
	FROM  new_orders orders
	LEFT JOIN LATERAL (SELECT * FROM npv_by_mp WHERE npv_by_mp.mp_name=orders.mp_name AND npv_by_mp.id_portfolio=orders.id_portfolio) npv_by_mp ON TRUE
	LEFT JOIN LATERAL (
		SELECT 
			tt.id_portfolio,tt.sec_type, tt.mtm_positon as npv_sec_type 
		FROM npv_by_rs_type tt WHERE tt.sec_type=orders.sec_type AND tt.id_portfolio=orders.id_portfolio
	) npv_sec_type ON TRUE
		LEFT JOIN LATERAL (
		SELECT 
			tt.id_portfolio,tt.listing, tt.mtm_positon as npv_listing 
		FROM npv_by_rs_type tt WHERE tt.listing=orders.listing AND tt.id_portfolio=orders.id_portfolio
	) npv_listing ON TRUE
	
	LEFT JOIN LATERAL (
		SELECT   
			rt.mp_id,rt.mp_name,rt.portfolio_restriction_by_mp,
			rt. mp_object_weight,COALESCE(rt.restriction_rate,200) as restriction_rate
		FROM f_i_r_get_restrictions (ARRAY(SELECT DISTINCT new_orders.id_portfolio FROM new_orders)) rt
		WHERE rt.id=orders.id_portfolio AND rt.mp_id=orders.mp_id AND rt.rest_type = 'sec_type' AND rt.type=orders.sec_type
	) sec_type_restrictions ON TRUE
	LEFT JOIN LATERAL (
		SELECT   
			rts.portfolio_restriction_by_mp,
			rts. mp_object_weight,COALESCE(rts.restriction_rate,200) as restriction_rate
		FROM f_i_r_get_restrictions (ARRAY(SELECT DISTINCT new_orders.id_portfolio FROM new_orders)) rts
		WHERE rts.id=orders.id_portfolio AND rts.mp_id=orders.mp_id AND rts.rest_type = 'secid' AND rts.secid=orders.secid
	) secid_restrictions ON TRUE
	LEFT JOIN LATERAL (
		SELECT   
			rts.portfolio_restriction_by_mp,
			rts. mp_object_weight,COALESCE(rts.restriction_rate,200) as restriction_rate
		FROM f_i_r_get_restrictions (ARRAY(SELECT DISTINCT new_orders.id_portfolio FROM new_orders)) rts
		WHERE rts.id=orders.id_portfolio AND rts.mp_id=orders.mp_id AND rts.rest_type = 'listing' AND rts.listing=orders.listing
	) listing_restrictions ON TRUE
	
	LEFT JOIN LATERAL (
		SELECT * FROM unnaccounted_orders
		WHERE unnaccounted_orders.id_portfolio = orders.id_portfolio AND unnaccounted_orders.sec_type= orders.sec_type
	) sc_unacc_orders ON TRUE
	LEFT JOIN LATERAL (
		SELECT * FROM unnaccounted_orders
		WHERE unnaccounted_orders.id_portfolio = orders.id_portfolio AND unnaccounted_orders.listing= orders.listing
	) ls_unacc_orders ON TRUE
	LEFT JOIN LATERAL (
		SELECT * FROM unnaccounted_orders
		WHERE unnaccounted_orders.id_portfolio = orders.id_portfolio AND unnaccounted_orders.secid= orders.secid
	) sec_unacc_orders ON TRUE
	
	WHERE
		(p_secid_list ISNULL OR LOWER(orders.secid) = ANY (p_secid_list) )
		AND (ABS(orders.amount / orders.notnull_npv * 100) > p_min_deviation OR orders.price ISNULL)
		AND orders.type NOTNULL
),
main_set_orders_by_rs AS (
	SELECT 
		CASE 
			WHEN main_set."type"='SELL' THEN main_set.amount
			WHEN main_set.rs_secid/100*main_set.npv-main_set.secid_balance-main_set.net_orders_secid<0 
			THEN 0
			ELSE LEAST(main_set.rs_secid/100*main_set.npv-main_set.secid_balance-main_set.net_orders_secid,main_set.amount) 
		END AS order_rs_secid,
		CASE 
			WHEN main_set."type"='SELL' THEN main_set.amount
			WHEN (main_set.rs_amount_sec_type - main_set.net_orders_sec_type - main_set.npv_sec_type - main_set.orders_net_amount_rt_sec_type)>0
			THEN main_set.amount
			ELSE 
				CASE 
				WHEN (main_set.rs_amount_sec_type - main_set.net_orders_sec_type- main_set.npv_sec_type - main_set.orders_net_amount_rt_sec_type + main_set.amount)<0
				THEN 0
				ELSE 
					ROUND((
						FLOOR(main_set.rs_amount_sec_type - main_set.net_orders_sec_type- main_set.npv_sec_type - main_set.orders_net_amount_rt_sec_type +main_set.amount)/main_set.price)*main_set.price,2)
				END
		END AS order_rs_sec_type,
		CASE 
			WHEN main_set."type"='SELL' THEN main_set.amount
			WHEN (main_set.rs_amount_listing - main_set.net_orders_listing - main_set.npv_listing - main_set.orders_net_amount_rt_listing)>0
			THEN main_set.amount
			ELSE 
				CASE 
				WHEN (main_set.rs_amount_listing - main_set.net_orders_listing- main_set.npv_listing - main_set.orders_net_amount_rt_listing + main_set.amount)<0
				THEN 0
				ELSE 
					ROUND((
						FLOOR(main_set.rs_amount_listing - main_set.net_orders_listing- main_set.npv_listing - main_set.orders_net_amount_rt_listing +main_set.amount)/main_set.price)*main_set.price,2)
				END
		END AS order_rs_listing,
		*
	FROM main_set
), 
main_set_with_leverage AS (
SELECT 
	LEAST(mt.npv*cash_restrictions.mp_weight/100 - mt.mp_npv,nord.amount) AS balance_corrected_by_mp,
	ROUND(cash_restrictions.portfolio_restriction_by_mp/100*mt.npv,2) as leverage_amount,
	cash_restrictions.portfolio_restriction_by_mp AS lv_corr,
	COALESCE(total_unacc_orders.net_orders,0) as total_net_orders,
	cash_restrictions.mp_leverage_good,
	nord.amount AS balance,
	SUM(
		CASE WHEN mt."type" = 'BUY' 
			 THEN LEAST(mt.amount,	mt.order_rs_sec_type,	mt.order_rs_listing,	mt.order_rs_secid)*-1 
			 ELSE LEAST(mt.amount,	mt.order_rs_sec_type,	mt.order_rs_listing,	mt.order_rs_secid) 
		END) 
	OVER (
		PARTITION BY mt.id_portfolio,mt.mp_id
			ORDER BY mt.id_portfolio,mt.mp_id, mt."type" DESC, LEAST(mt.amount,	mt.order_rs_sec_type,	mt.order_rs_listing,	mt.order_rs_secid) 
			ROWS BETWEEN UNBOUNDED PRECEDING  AND CURRENT ROW
	) AS orders_net_amt_rt,
	cash_restrictions.mp_weight,
	LEAST(mt.amount,	mt.order_rs_sec_type,	mt.order_rs_listing,	mt.order_rs_secid) AS order_amount_main, mt.* 
	FROM main_set_orders_by_rs mt
	LEFT JOIN LATERAL (
		SELECT new_orders.amount,new_orders.npv from new_orders where mt.id_portfolio = new_orders.id_portfolio AND LEFT(new_orders.secid,5)='MONEY'
	) nord ON TRUE
	LEFT JOIN LATERAL (
		SELECT   
			rts.portfolio_restriction_by_mp,rts.mp_weight,
			rts. mp_object_weight,COALESCE(rts.restriction_rate,200) as restriction_rate, (100+restriction_rate)>=sum_weight AS mp_leverage_good
		FROM f_i_r_get_restrictions (ARRAY(SELECT DISTINCT new_orders.id_portfolio FROM new_orders)) rts
		WHERE rts.id=mt.id_portfolio AND rts.mp_id=mt.mp_id AND rts.rest_type = 'cash'
	) cash_restrictions ON TRUE
	
	LEFT JOIN LATERAL (
		SELECT * FROM unnaccounted_orders uord
		WHERE uord.id_portfolio = mt.id_portfolio AND uord.mp_id = mt.mp_id
	) total_unacc_orders ON TRUE
),
main_set_with_order_at_max_lever AS (
	SELECT 
		CASE 
			WHEN msl."type"='SELL' THEN msl.order_amount_main
			WHEN (msl.balance_corrected_by_mp + msl.leverage_amount - msl.total_net_orders + msl.orders_net_amt_rt)>0
			THEN msl.order_amount_main
			ELSE 
				CASE 
				WHEN (msl.balance_corrected_by_mp + msl.leverage_amount - msl.total_net_orders + msl.orders_net_amt_rt +msl.order_amount_main)<0
				THEN 0
				ELSE 
					ROUND((
						FLOOR(msl.balance_corrected_by_mp + msl.leverage_amount  - msl.total_net_orders + msl.orders_net_amt_rt +msl.order_amount_main)/msl.price)*msl.price,2)
				END
		END AS order_at_max_limit, 
		msl.* 
		FROM main_set_with_leverage msl
)
SELECT 
	CASE 
		WHEN msmo."type"='SELL' THEN msmo.order_amount_main
		WHEN p_leverage_handle = 0 THEN msmo.order_amount_main
		WHEN p_leverage_handle = 1 THEN CASE WHEN msmo.mp_leverage_good=true THEN msmo.order_amount_main ELSE 0 END
		WHEN p_leverage_handle = 2 THEN msmo.order_at_max_limit
	END::numeric(20,2) AS order_amount_final,msmo.* 
	FROM main_set_with_order_at_max_lever msmo;
-- WHERE (	
-- 	CASE 
-- 		WHEN msmo."type"='SELL' THEN msmo.order_amount_main
-- 		WHEN p_leverage_handle = 0 THEN msmo.order_amount_main
-- 		WHEN p_leverage_handle = 1 THEN CASE WHEN msmo.mp_leverage_good=true THEN msmo.order_amount_main ELSE 0 END
-- 		WHEN p_leverage_handle = 2 THEN msmo.order_at_max_limit
-- 	END
-- 	*100/msmo.npv)>=p_min_deviation OR msmo.price isnull;
END;
$BODY$;

ALTER FUNCTION public.f_i_o_prepare_orders_data_by_mp_v3(integer, text[], text[], date, integer, numeric)
    OWNER TO postgres;
select * from f_i_o_prepare_orders_data_by_mp_v3 (2,array['icm019'],array['aapl-rm','csco-rm','goog-rm','tsla-rm'],now()::date,840,1)
