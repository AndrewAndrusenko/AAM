-- FUNCTION: public.f_i_o_get_orders_unaccounted_qty(numeric[], text[])

-- DROP FUNCTION IF EXISTS public.f_i_o_get_orders_unaccounted_qty(numeric[], text[]);

CREATE OR REPLACE FUNCTION public.f_i_o_get_orders_unaccounted_qty(
	p_id_portfolio numeric[],
	p_secid text[])
    RETURNS TABLE(id_portfolio numeric, secid character varying, type character varying, qty numeric, amount numeric, accounted numeric, unaccounted_qty numeric, unaccounted_amount numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN QUERY
WITH
  unaccounted_orders AS (
    SELECT * FROM dorders 
	  WHERE dorders.status !='accounted' AND ordertype='Client' 
	  AND (p_id_portfolio ISNULL OR dorders.id_portfolio = ANY(p_id_portfolio))
	  AND (p_secid ISNULL OR dorders.secid = ANY(p_secid))
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
      AND ("ledgerNoId" = 13)
    GROUP BY
      dtrades_allocated.id_order
  )
SELECT
  unaccounted_orders.id_portfolio,
  unaccounted_orders.secid,
  unaccounted_orders.type,
  SUM(unaccounted_orders.qty) AS qty,
  SUM(unaccounted_orders.amount) AS amount,
  SUM(
    COALESCE(partly_accounted_orders.accounted_qty, 0)
  ) AS accounted,
  SUM(unaccounted_orders.qty - COALESCE(partly_accounted_orders.accounted_qty, 0)) AS unaccounted_qty,
  CASE 
	  WHEN unaccounted_orders.qty = 0
	  THEN 0
	  ELSE SUM(unaccounted_orders.qty-COALESCE(partly_accounted_orders.accounted_qty, 0))*SUM(unaccounted_orders.amount)/SUM(COALESCE(unaccounted_orders.qty,1)) 
	END AS unaccounted_amount
   
FROM
  unaccounted_orders
  FULL JOIN partly_accounted_orders ON unaccounted_orders.id = partly_accounted_orders.id_order
GROUP BY
	  unaccounted_orders.id_portfolio,
      unaccounted_orders.secid,
      unaccounted_orders.type,
	  unaccounted_orders.qty;
END;

$BODY$;

ALTER FUNCTION public.f_i_o_get_orders_unaccounted_qty(numeric[], text[])
    OWNER TO postgres;
select * from f_i_o_get_orders_unaccounted_qty(array[29,7],null)