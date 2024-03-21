-- FUNCTION: public.f_i_o_create_orders_by_mp(text[], text[], date, integer, numeric)

-- DROP FUNCTION IF EXISTS public.f_i_o_create_orders_by_mp_v2(text[], text[], date, integer, numeric);

CREATE OR REPLACE FUNCTION public.f_i_o_create_orders_by_mp_v2(
	p_portfolio_code text[],
	p_secid_list text[],
	p_report_date date,
	p_report_currency integer,
	p_min_deviation numeric)
    RETURNS SETOF dorders 
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
  WHEN f_i_get_portfolios_structure_detailed_data.secid = 'MONEY (840)' THEN f_i_get_portfolios_structure_detailed_data.current_balance
  ELSE ABS(order_amount)
  END
  AS amount,
  0::NUMERIC AS qty_executed,
  'created'::CHARACTER VARYING AS status,
  NULL::INT AS parent_order,
  idportfolio::NUMERIC AS id_portfolio,
  0::NUMERIC AS order_type,
  report_currency::NUMERIC AS idcurrency,
  NULL::NUMERIC[] AS child_orders,
  'Client'::CHARACTER VARYING AS ordertype,
  f_i_get_portfolios_structure_detailed_data.mp_id::BIGINT,
  notnull_npv
FROM
  f_i_get_portfolios_structure_detailed_data (p_portfolio_code, p_report_date, p_report_currency)
WHERE LOWER(f_i_get_portfolios_structure_detailed_data.secid) = ANY (p_secid_list||ARRAY['money (840)']);

SELECT
  ARRAY_AGG(CONCAT(dportfolios.portfolioname,' ',new_orders.secid,' ', new_orders."type",'. Opposite order:', dorders.id)) INTO opposite_orders
FROM
  new_orders
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
  dorders.status != 'accounted';

IF ARRAY_LENGTH(opposite_orders, 1) > 0 THEN 
  RAISE EXCEPTION 'There are active opposite orders for the following  %',opposite_orders;
END IF;

RETURN QUERY
SELECT 
 1::bigint,generated, type, secid, qty, balances.amount as price, orders.amount, qty_executed, status, (balances.amount - orders.amount)::int as parent_order, id_portfolio, order_type, idcurrency, child_orders, ordertype, mp_id
FROM  new_orders orders
LEFT JOIN LATERAL (
SELECT amount from new_orders where secid='MONEY (840)' and new_orders.id_portfolio=orders.id_portfolio
) balances ON TRUE
WHERE
  ABS(orders.amount / orders.notnull_npv * 100) > p_min_deviation
  AND orders.qty > 0
;
END;
$BODY$;

ALTER FUNCTION public.f_i_o_create_orders_by_mp_v2(text[], text[], date, integer, numeric)
    OWNER TO postgres;
select * from f_i_o_create_orders_by_mp_v2 (array['acm002','icm011'],array['lly-rm'],now()::date,840,1)