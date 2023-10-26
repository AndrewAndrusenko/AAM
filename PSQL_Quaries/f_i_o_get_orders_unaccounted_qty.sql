-- FUNCTION: public.f_i_o_get_orders_unaccounted_qty(numeric[])

DROP FUNCTION IF EXISTS public.f_i_o_get_orders_unaccounted_qty();

CREATE OR REPLACE FUNCTION public.f_i_o_get_orders_unaccounted_qty(
	)
    RETURNS TABLE(id_portfolio numeric, secid character varying, type character varying,  qty numeric, accounted numeric, unaccounted_qty numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN QUERY
WITH
  unaccounted_orders AS (
    SELECT * FROM dorders WHERE dorders.status !='accounted' AND ordertype='Client'
  ),
  partly_accounted_orders AS (
    SELECT
      dtrades_allocated.id_order,
      SUM("bAccountTransaction"."amountTransaction") AS accounted_qty
    FROM
      "bAccountTransaction"
      LEFT JOIN dtrades_allocated ON dtrades_allocated.id = "bAccountTransaction".idtrade
    WHERE
      dtrades_allocated.id_order = ANY (SELECT id FROM unaccounted_orders)
      AND "bAccountTransaction".idtrade NOTNULL
      AND ("accountId" = 13 OR "ledgerNoId" = 13)
    GROUP BY
      dtrades_allocated.id_order
  )
SELECT
  unaccounted_orders.id_portfolio,
  unaccounted_orders.secid,
  unaccounted_orders.type,
  SUM(unaccounted_orders.qty) AS qty,
  SUM(
    COALESCE(partly_accounted_orders.accounted_qty, 0)
  ) AS accounted,
  SUM(
    unaccounted_orders.qty - COALESCE(partly_accounted_orders.accounted_qty, 0)
  ) AS unaccounted_qty
FROM
  unaccounted_orders
  FULL JOIN partly_accounted_orders ON unaccounted_orders.id = partly_accounted_orders.id_order
GROUP BY
	  unaccounted_orders.id_portfolio,
      unaccounted_orders.secid,
      unaccounted_orders.type;
END;

$BODY$;

ALTER FUNCTION public.f_i_o_get_orders_unaccounted_qty()
    OWNER TO postgres;
