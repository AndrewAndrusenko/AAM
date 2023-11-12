-- FUNCTION: public.f_i_get_portfolios_list_by_strategy(text)

DROP FUNCTION IF EXISTS public.f_i_get_bulk_order_details(numeric);

CREATE OR REPLACE FUNCTION public.f_i_get_bulk_order_details(
	p_id_bulk_order numeric)
    RETURNS TABLE(
		mp_name char varying,
		secid char varying,
		id bigint ,
		generated date,
		qty numeric,
		allocated numeric,
		unexecuted numeric,
		price numeric, 
		amount numeric, 
		status char varying, 
		idcurrency numeric, 
		currencycode char varying,
		type char varying
	)	
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN QUERY
SELECT
  dstrategiesglobal.sname AS mp_name,
  dorders.secid,
  dorders.id,
  dorders.generated,
  dorders.qty,
  COALESCE(allocated_qty.allocated, 0) AS allocated,
  dorders.qty - COALESCE(allocated_qty.allocated, 0) AS unexecuted,
  dorders.price,
  dorders.amount,
  dorders.status,
  dorders.idcurrency,
  "dCurrencies"."CurrencyCode" AS currencycode,
  dorders.type
FROM
  public.dorders
  LEFT JOIN "dCurrencies" ON dorders.idcurrency = "dCurrencies"."CurrencyCodeNum"
  LEFT JOIN dstrategiesglobal ON dstrategiesglobal.id = dorders.mp_id
  LEFT JOIN (
    SELECT
      id_bulk_order,
      SUM(dtrades_allocated.qty) AS allocated
    FROM
      public.dtrades_allocated
    WHERE
      id_bulk_order = p_id_bulk_order
    GROUP BY
      id_bulk_order
  ) AS allocated_qty ON allocated_qty.id_bulk_order = dorders.id
WHERE
  dorders.id = p_id_bulk_order;
END;
$BODY$;

ALTER FUNCTION public.f_i_get_bulk_order_details(numeric)
    OWNER TO postgres;
	select * from f_i_get_bulk_order_details(451)
