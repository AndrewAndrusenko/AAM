-- FUNCTION: public.f_fifo_select_accounting_summary()

-- DROP FUNCTION IF EXISTS public.f_fifo_select_accounting_summary();

CREATE OR REPLACE FUNCTION public.f_fifo_select_accounting_summary(
	)
    RETURNS TABLE(idtrade numeric, balance_qty numeric, fifo_qty numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN query
SELECT
  dtrades_allocated.idtrade,
  SUM("bAccountTransaction"."amountTransaction"),
  fifo_table.fifo_qty
FROM
  "bAccountTransaction"
  LEFT JOIN dtrades_allocated ON dtrades_allocated.id = "bAccountTransaction".idtrade
  FULL JOIN (
    SELECT
      dtrades_allocated.idtrade,
      SUM(
		  CASE WHEN id_sell_trade=0 THEN dtrades_allocated_fifo.qty
		  ELSE dtrades_allocated_fifo.qty_out
		  END
	  ) AS fifo_qty
    FROM
      dtrades_allocated_fifo
	  LEFT JOIN dtrades_allocated ON dtrades_allocated.id = dtrades_allocated_fifo.idtrade
    WHERE
      closed ISNULL
      OR id_sell_trade = 0
    GROUP BY
      dtrades_allocated.idtrade
  ) AS fifo_table ON fifo_table.idtrade = dtrades_allocated.idtrade
WHERE
  "bAccountTransaction".idtrade NOTNULL
  AND (
    "accountId" = 13
    OR "ledgerNoId" = 13
  )
GROUP BY
  dtrades_allocated.idtrade,
  fifo_table.fifo_qty;
END;
$BODY$;

ALTER FUNCTION public.f_fifo_select_accounting_summary()
    OWNER TO postgres;
