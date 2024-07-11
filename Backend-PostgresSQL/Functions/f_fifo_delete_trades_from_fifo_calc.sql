-- FUNCTION: public.f_fifo_delete_trades_from_fifo_calc(numeric[])

-- DROP FUNCTION IF EXISTS public.f_fifo_delete_trades_from_fifo_calc(numeric[]);

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
DELETE FROM dtrades_allocated_fifo
WHERE
  dtrades_allocated_idtrade = ANY (p_idtrades)
  OR dtrades_allocated_id_sell_trade = ANY (p_idtrades)
RETURNING
  id,
  idtrade,
  tr_type,
  qty,
  qty_out,
  idportfolio,
  trade_date,
  closed,
  id_buy_trade,
  id_sell_trade;

END;
$BODY$;

ALTER FUNCTION public.f_fifo_delete_trades_from_fifo_calc(numeric[])
    OWNER TO postgres;
