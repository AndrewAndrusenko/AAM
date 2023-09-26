-- FUNCTION: public.f_fifo_delete_trades_from_fifo_calc(numeric[])

DROP FUNCTION IF EXISTS public.f_fifo_delete_trades_from_fifo_calc(numeric[]);

CREATE OR REPLACE FUNCTION public.f_fifo_delete_trades_from_fifo_calc(
	p_idtrades numeric[])
    RETURNS TABLE(id bigint, idtrade bigint, tr_type smallint, qty numeric, qty_out numeric, idportfolio numeric, trade_date date, closed boolean, id_buy_trade numeric, id_sell_trade numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN QUERY
WITH
  deleted_fifo AS (
    DELETE FROM dtrades_allocated_fifo
    WHERE
      dtrades_allocated_fifo.idtrade = ANY (p_idtrades)
    RETURNING
      *
  )
UPDATE dtrades_allocated_fifo fifo
SET
  qty_out = fifo.qty_out - deleted_grouped_by_trade.qty_out,
  closed = CASE
    WHEN fifo.qty = fifo.qty_out - deleted_grouped_by_trade.qty_out THEN TRUE
    ELSE FALSE
  END
FROM
  dtrades_allocated_fifo fifo1
  INNER JOIN (
    SELECT
      deleted_fifo.id_buy_trade,
      SUM(deleted_fifo.qty_out) AS qty_out
    FROM
      deleted_fifo
    GROUP BY
      deleted_fifo.id_buy_trade
  ) deleted_grouped_by_trade ON deleted_grouped_by_trade.id_buy_trade = fifo1.idtrade
WHERE
  fifo.id = fifo1.id
RETURNING fifo.id , fifo.idtrade ,fifo.tr_type ,fifo.qty, fifo.qty_out, fifo.idportfolio, fifo.trade_date ,fifo.closed , fifo.id_buy_trade , 
				  fifo.id_sell_trade ;
END;
$BODY$;

ALTER FUNCTION public.f_fifo_delete_trades_from_fifo_calc(numeric[])
    OWNER TO postgres;
