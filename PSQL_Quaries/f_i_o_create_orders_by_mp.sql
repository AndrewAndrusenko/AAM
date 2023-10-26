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
BEGIN
RETURN query
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
    ordertype
  )
SELECT
  NOW()::TIMESTAMP WITHOUT TIME ZONE,
  f_i_get_portfolios_structure_detailed_data.order_type,
  f_i_get_portfolios_structure_detailed_data.secid,
  order_qty,
  mtm_rate,
  ABS(order_amount),
  0,
  'created',
  NULL,
  idportfolio,
  0,
  main_currency_code,
  NULL,
  'Client'
FROM
  f_i_get_portfolios_structure_detailed_data (p_portfolio_code,p_report_date,p_report_currency)
WHERE
  ABS(f_i_get_portfolios_structure_detailed_data.order_amount/f_i_get_portfolios_structure_detailed_data.notnull_npv*100) > p_min_deviation
  AND f_i_get_portfolios_structure_detailed_data.order_qty > 0
  AND LOWER(f_i_get_portfolios_structure_detailed_data.secid) = ANY (p_secid_list)
RETURNING *;
END;
$BODY$;

ALTER FUNCTION public.f_i_o_create_orders_by_mp(text[], text[], date, integer, numeric)
    OWNER TO postgres;
