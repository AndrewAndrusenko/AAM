-- FUNCTION: public.f_fifo_select_accounting_summary()

DROP FUNCTION IF EXISTS public.f_i_orders_accounted_qty();

CREATE OR REPLACE FUNCTION public.f_i_orders_accounted_qty(
	)
    RETURNS TABLE(id_order numeric, balance_qty numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN query
SELECT
  dtrades_allocated.id_order,
  SUM("bAccountTransaction"."amountTransaction")
FROM
  "bAccountTransaction"
  LEFT JOIN dtrades_allocated ON dtrades_allocated.id = "bAccountTransaction".idtrade

WHERE
  "bAccountTransaction".idtrade NOTNULL
  AND (
    "accountId" = 13
    OR "ledgerNoId" = 13
  )
GROUP BY
  dtrades_allocated.id_order;
END;
$BODY$;

ALTER FUNCTION public.f_i_orders_accounted_qty()
    OWNER TO postgres;
select * from f_i_orders_accounted_qty()