-- FUNCTION: public.f_i_o_create_orders_by_mp(text[], text[], date, integer, numeric)

-- DROP FUNCTION IF EXISTS public.f_i_o_create_orders_by_mp_v2(int,text[], text[], date, integer, numeric);

CREATE OR REPLACE FUNCTION public.f_i_o_create_orders_by_mp_v2(
	p_leverage_handle int,
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
BEGIN
RETURN QUERY
WITH 
orders_to_insert AS (
	SELECT
		"generated",
		"type",
		secid,
		FLOOR(order_amount_main/price) AS qty,
		price,
		ROUND(FLOOR(order_amount_main/price)*price,2) order_amount_main,
		qty_executed,
		status,
		parent_order,
	  id_portfolio,
		order_type,
		idcurrency,
		child_orders::numeric[],
		ordertype,
		pr_ords.mp_id
	FROM
	f_i_o_prepare_orders_data_by_mp_v2 (p_leverage_handle,p_portfolio_code,p_secid_list,p_report_date,p_report_currency,p_min_deviation) pr_ords
	WHERE
		FLOOR(order_amount_main/price) > 0
)
INSERT INTO
  public.dorders (
    generated,
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
SELECT * FROM  orders_to_insert
RETURNING *;
END;
$BODY$;

ALTER FUNCTION public.f_i_o_create_orders_by_mp_v2(int,text[], text[], date, integer, numeric)
    OWNER TO postgres;
select amount, * 
from f_i_o_create_orders_by_mp_v2 
(2,array['acm002'],array['lly-rm','nflx-rm','tsla-rm','goog-rm','aapl-rm','spot-rm','csco-rm'],now()::date,840,0.1)