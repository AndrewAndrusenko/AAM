-- FUNCTION: public.f_i_o_create_orders_by_mp(text[], text[], date, integer, numeric)

-- DROP FUNCTION IF EXISTS public.f_i_o_create_orders_by_mp(text[], text[], date, integer, numeric);

CREATE OR REPLACE FUNCTION public.f_i_o_create_orders_by_mp(
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
  NOW()::date AS generated,
  f_i_get_portfolios_structure_detailed_data.order_type::CHARACTER VARYING AS
  type,
  f_i_get_portfolios_structure_detailed_data.secid,
  order_qty AS qty,
  mtm_dirty_price AS price,
  ABS(order_amount) AS amount,
  0::NUMERIC AS qty_executed,
  'created'::CHARACTER VARYING AS status,
  NULL::INT AS parent_order,
  idportfolio::NUMERIC AS id_portfolio,
  0::NUMERIC AS order_type,
  report_currency::NUMERIC AS idcurrency,
  NULL::NUMERIC[] AS child_orders,
  'Client'::CHARACTER VARYING AS ordertype,
  f_i_get_portfolios_structure_detailed_data.mp_id::BIGINT
FROM
  f_i_get_portfolios_structure_detailed_data (p_portfolio_code, p_report_date, p_report_currency)
WHERE
  ABS(f_i_get_portfolios_structure_detailed_data.order_amount / f_i_get_portfolios_structure_detailed_data.notnull_npv * 100) > p_min_deviation
  AND f_i_get_portfolios_structure_detailed_data.order_qty > 0
  AND LOWER(f_i_get_portfolios_structure_detailed_data.secid) = ANY (p_secid_list);

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
INSERT INTO
  public.dorders (
    genarated,
    type,
    secid,
    qty,
    price,
    amount,
    qty_executed,
    status,
    parent_order,
    id_portfolio,
    order_type,
    idcurrency,
    child_orders,
    ordertype,
    mp_id
  )
SELECT * FROM  new_orders
RETURNING *;
END;
$BODY$;

ALTER FUNCTION public.f_i_o_create_orders_by_mp(text[], text[], date, integer, numeric)
    OWNER TO postgres;
