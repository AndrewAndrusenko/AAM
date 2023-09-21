-- FUNCTION: public.f_fifo_select_unsold_portfolio(numeric, text, numeric, numeric, numeric)

DROP FUNCTION IF EXISTS public.f_fifo_create_buy_transactions(p_idtrades numeric[]);

CREATE
OR REPLACE FUNCTION public.f_fifo_create_buy_transactions (
  p_idtrades NUMERIC[]
) RETURNS TABLE (
	id BIGINT,
	idtrade BIGINT,
	tr_type smallint,
	qty NUMERIC,
	qty_out NUMERIC,
	price_in NUMERIC,
	price_out NUMERIC,
	closed boolean,
	idportfolio NUMERIC,
	trade_date date,
	secid character varying ,
	generated date,
	profit_loss NUMERIC,
	id_sell_trade NUMERIC,
	id_buy_trade NUMERIC
	
) LANGUAGE 'plpgsql' COST 100 VOLATILE PARALLEL UNSAFE ROWS 1000

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
	secid
  )
SELECT
  dtrades_allocated.id,
  0,
  dtrades_allocated.qty,
  0,
  dtrades.trade_amount / dtrades.qty,
  0,
  FALSE,
  dtrades_allocated.idportfolio,
  dtrades.tdate,
  now(),
  dtrades.tidinstrument
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

ALTER FUNCTION public.f_fifo_create_buy_transactions(p_idtrades numeric[])
    OWNER TO postgres;
