-- FUNCTION: public.f_fifo_select_pl_for_trade(numeric)

-- DROP FUNCTION IF EXISTS public.f_fifo_select_pl_for_all_trades(numeric);

CREATE OR REPLACE FUNCTION public.f_fifo_select_pl_for_all_trades(
	p_start_date date)
    RETURNS TABLE(idtrade bigint, pl numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN query
SELECT
  dtrades_allocated_fifo.idtrade,
  SUM(profit_loss) AS pl
FROM
  dtrades_allocated_fifo
  LEFT JOIN dtrades_allocated ON dtrades_allocated.id = dtrades_allocated_fifo.idtrade
WHERE
  dtrades_allocated_fifo.trade_date >= p_start_date
  AND profit_loss NOTNULL
GROUP BY
  dtrades_allocated_fifo.idtrade;
END;
$BODY$;

ALTER FUNCTION public.f_fifo_select_pl_for_all_trades(date)
    OWNER TO postgres;
