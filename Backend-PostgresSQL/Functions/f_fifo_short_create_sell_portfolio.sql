-- FUNCTION: public.f_fifo_create_buy_transactions(numeric[])

-- DROP FUNCTION IF EXISTS public.f_fifo_short_create_sell_portfolio(numeric[]);

CREATE OR REPLACE FUNCTION public.f_fifo_short_create_sell_portfolio(
	p_idtrades numeric[])
    RETURNS TABLE(id bigint, idtrade bigint, tr_type smallint, qty numeric, qty_out numeric, price_in numeric, price_out numeric, closed boolean, idportfolio numeric, trade_date date, secid character varying, generated date, profit_loss numeric, id_sell_trade numeric, id_buy_trade numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN query
INSERT INTO
  public.dtrades_allocated_fifo (
    idtrade,
    tr_type,
    qty,
    qty_out,
    price_in,
    price_out,
    closed,
    idportfolio,
    trade_date,
	generated,
	secid,
	id_sell_trade
  )
SELECT
  dtrades_allocated.id,
  1,
  dtrades_allocated.qty,
  0,
  dtrades.trade_amount / dtrades.qty,
  0,
  FALSE,
  dtrades_allocated.idportfolio,
  dtrades.tdate,
  now(),
  dtrades.tidinstrument,
  0
FROM
  public.dtrades_allocated
  LEFT JOIN (
    SELECT
      "bAccountTransaction".idtrade,
      COUNT( "bAccountTransaction".id) AS e_qty
    FROM
      "bAccountTransaction"
    WHERE
      "bAccountTransaction".idtrade NOTNULL
    GROUP BY
       "bAccountTransaction".idtrade
  ) AS accounted_trades ON accounted_trades.idtrade = dtrades_allocated.id
  LEFT JOIN dtrades ON dtrades.idtrade = dtrades_allocated.idtrade
WHERE
  accounted_trades.e_qty NOTNULL 
  AND dtrades_allocated.id=ANY(ARRAY[p_idtrades])
  RETURNING *;

END;
$BODY$;

ALTER FUNCTION public.f_fifo_short_create_sell_portfolio(numeric[])
    OWNER TO postgres;
