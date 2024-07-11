-- FUNCTION: public.f_i_o_create_orders_by_mp(text[], text[], date, integer, numeric)

-- DROP FUNCTION IF EXISTS public.f_i_o_create_orders_by_mp2(text[], text[], date, integer, numeric);

CREATE OR REPLACE FUNCTION public.f_i_o_create_orders_by_mp2(
	p_portfolio_code text[],
	p_secid_list text[],
	p_report_date date,
	p_report_currency integer,
	p_min_deviation numeric)
-- 	returns table (ttt text, id bigint)
    RETURNS SETOF dorders 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
DECLARE 
opposite_orders text[];
BEGIN
WITH new_orders AS (
SELECT
  NOW()::date as generated,
  f_i_get_portfolios_structure_detailed_data.order_type::character varying as type,
  f_i_get_portfolios_structure_detailed_data.secid,
  order_qty as qty,
  mtm_dirty_price as price,
  ABS(order_amount) as amount,
  0::numeric as qty_executed,
  'created'::character varying as status,
  NULL::int as parent_order,
  idportfolio::numeric as id_portfolio,
  0::numeric as order_type,
  report_currency::numeric as idcurrency ,
  NULL::numeric[] AS child_orders,
  'Client'::character varying AS ordertype,
  f_i_get_portfolios_structure_detailed_data.mp_id::bigint 
FROM
  f_i_get_portfolios_structure_detailed_data (p_portfolio_code,p_report_date,p_report_currency)
WHERE
  ABS(f_i_get_portfolios_structure_detailed_data.order_amount/f_i_get_portfolios_structure_detailed_data.notnull_npv*100) > p_min_deviation
  AND f_i_get_portfolios_structure_detailed_data.order_qty > 0
  AND LOWER(f_i_get_portfolios_structure_detailed_data.secid) = ANY (p_secid_list)
), 

reverse_orders_select AS (
	select 
-- 	dorders.id, new_orders.*
	new_orders.*, dorders.id,dportfolios.portfolioname
	from new_orders 
	LEFT JOIN  dorders ON new_orders.secid = dorders.secid
	AND new_orders.id_portfolio = dorders.id_portfolio
	AND (CASE WHEN new_orders."type"='SELL' THEN 'BUY' ELSE 'SELL' END )=  dorders.type
	LEFT JOIN dportfolios ON dportfolios.idportfolio = new_orders.id_portfolio
	where dorders.status!='accounted'
)
SELECT array_agg(concat(portfolioname, ' ',secid,' ',"type",'. Opposite order:',reverse_orders_select.id)) into opposite_orders 
from reverse_orders_select;
IF array_length(opposite_orders,1)>0 THEN
RAISE EXCEPTION 'There are active opposite orders for the following  %', opposite_orders;
ELSE
RETURN QUERY
SELECT
1::bigint,
  NOW()::date as generated,
  f_i_get_portfolios_structure_detailed_data.order_type::character varying as type,
  f_i_get_portfolios_structure_detailed_data.secid,
  order_qty as qty,
  mtm_dirty_price as price,
  ABS(order_amount) as amount,
  0::numeric as qty_executed,
  'created'::character varying as status,
  NULL::int as parent_order,
  idportfolio::numeric as id_portfolio,
  0::numeric as order_type,
  report_currency::numeric as idcurrency ,
  NULL::numeric[] AS child_orders,
  'Client'::character varying AS ordertype,
  f_i_get_portfolios_structure_detailed_data.mp_id::bigint ,
  ''::text
FROM
  f_i_get_portfolios_structure_detailed_data (p_portfolio_code,p_report_date,p_report_currency)
WHERE
  ABS(f_i_get_portfolios_structure_detailed_data.order_amount/f_i_get_portfolios_structure_detailed_data.notnull_npv*100) > p_min_deviation
  AND f_i_get_portfolios_structure_detailed_data.order_qty > 0
  AND LOWER(f_i_get_portfolios_structure_detailed_data.secid) = ANY (p_secid_list);
END IF;
 

-- select 1::bigint,
-- generated, type, secid, qty, price, amount, qty_executed, status, parent_order, 
-- id_portfolio, order_type, idcurrency, child_orders, ordertype, mp_id, 

-- -- reverse_orders_select.*,
-- CASE WHEN EXISTS(SELECT * FROM reverse_orders_select) THEN 
-- f_cm_raise_exception ('There are active opposite orders for the following  '||(
-- 	SELECT array_agg(concat(portfolioname, ' ',secid,' ',"type",'. Opposite order:',reverse_orders_select.id)) from reverse_orders_select)::text,TRUE) END	
-- from new_orders;
-- SELECT CASE WHEN EXISTS(SELECT * FROM reverse_orders_select) THEN 
--   f_cm_raise_exception ('There are active opposite orders for the following  '||(SELECT array_agg(concat(portfolioname, ' ',secid,' ',order_type,'. Opposite order:',reverse_orders_select.id)) from reverse_orders_select)::text,TRUE) END	, dorders.id 
-- from dorders;

-- WITH new_orders AS (
-- SELECT
--   NOW()::date,
--   f_i_get_portfolios_structure_detailed_data.order_type::character varying,
--   f_i_get_portfolios_structure_detailed_data.secid,
--   order_qty,
--   mtm_dirty_price,
--   ABS(order_amount),
--   0::numeric,
--   'created'::character varying,
--   NULL::int,
--   idportfolio::numeric,
--   0::numeric,
--   report_currency::numeric ,
--   NULL::numeric[],
--   'Client'::character varying,
--   f_i_get_portfolios_structure_detailed_data.mp_id::bigint 
-- FROM
--   f_i_get_portfolios_structure_detailed_data (p_portfolio_code,p_report_date,p_report_currency)
-- WHERE
--   ABS(f_i_get_portfolios_structure_detailed_data.order_amount/f_i_get_portfolios_structure_detailed_data.notnull_npv*100) > p_min_deviation
--   AND f_i_get_portfolios_structure_detailed_data.order_qty > 0
--   AND LOWER(f_i_get_portfolios_structure_detailed_data.secid) = ANY (p_secid_list)
-- ) 
-- select dorders.id::bigint,new_orders.*
-- from new_orders  LEFT JOIN  dorders ON new_orders.secid = dorders.secid
-- AND new_orders.idportfolio = dorders.id_portfolio
-- AND (CASE WHEN new_orders."order_type"='SELL' THEN 'BUY' ELSE 'SELL' END )=  dorders.type
-- where status!='accounted';

-- INSERT INTO
--   public.dorders (
--     generated,
--     type,
--     secid,
--     qty,
--     price,
--     amount,
--     qty_executed,
--     status,
--     parent_order,
--     id_portfolio,
--     order_type,
--     idcurrency,
--     child_orders,
--     ordertype,
-- 	mp_id
--   )
-- SELECT
-- *
-- FROM new_orders
-- RETURNING *;
END;
$BODY$;

ALTER FUNCTION public.f_i_o_create_orders_by_mp2(text[], text[], date, integer, numeric)
    OWNER TO postgres;
-- SELECT * FROM
-- f_i_o_create_orders_by_mp2 (array['acm002','vpc005','icm011'],array['aapl-rm','goog-rm'],now()::date,840,0.01)
