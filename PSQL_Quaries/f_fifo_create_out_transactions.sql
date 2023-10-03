-- FUNCTION: public.f_fifo_create_out_transactions(numeric, numeric)

-- DROP FUNCTION IF EXISTS public.f_fifo_create_out_transactions(numeric, numeric);

CREATE OR REPLACE FUNCTION public.f_fifo_create_out_transactions(
	p_tr_type_to_close numeric,
	p_id_out_trade numeric)
    RETURNS TABLE(id bigint, idtrade bigint, tr_type smallint, qty numeric, qty_out numeric, price_in numeric, price_out numeric, closed boolean, idportfolio numeric, trade_date date, secid character varying, profit_loss numeric, id_sell_trade numeric, id_buy_trade numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
DECLARE
out_trade_details record;
BEGIN
SELECT INTO out_trade_details dtrades.tdate,
dtrades_allocated.id,
dtrades_allocated.idportfolio,
dtrades_allocated.qty,
dtrades.price,
dtrades.tidinstrument
FROM
  dtrades_allocated
  LEFT JOIN dtrades ON dtrades_allocated.idtrade = dtrades.idtrade
WHERE
  dtrades_allocated.id = p_id_out_trade;

RETURN query
INSERT INTO
  public.dtrades_allocated_fifo (
    trade_date,
    idtrade,
    tr_type,
    qty,
    qty_out,
    price_in,
    price_out,
    idportfolio,
    secid,
    GENERATED,
    profit_loss,
    id_sell_trade,
    id_buy_trade,
    closed,
    out_date
  )
SELECT
  out_trade_details.tdate,
  out_trade_details.id,
  f_fifo_select_open_position.tr_type,
  f_fifo_select_open_position.qty,
  f_fifo_select_open_position.qty_out,
  f_fifo_select_open_position.price_in,
  f_fifo_select_open_position.price_out,
  f_fifo_select_open_position.idportfolio,
  f_fifo_select_open_position.secid,
  f_fifo_select_open_position.generated,
  f_fifo_select_open_position.profit_loss,
  f_fifo_select_open_position.id_sell_trade,
  f_fifo_select_open_position.idtrade,
  NULL AS closed,
  out_trade_details.tdate AS out_date
FROM
  f_fifo_select_open_position (
    out_trade_details.idportfolio,
    out_trade_details.tidinstrument,
    out_trade_details.qty,
    out_trade_details.price,
    p_id_out_trade,
    p_tr_type_to_close
  )
UNION
SELECT
  f_fifo_select_open_position.trade_date,
  f_fifo_select_open_position.idtrade,
  f_fifo_select_open_position.tr_type * -1,
  f_fifo_select_open_position.qty,
  f_fifo_select_open_position.qty_out,
  f_fifo_select_open_position.price_in,
  f_fifo_select_open_position.price_out,
  f_fifo_select_open_position.idportfolio,
  f_fifo_select_open_position.secid,
  f_fifo_select_open_position.generated,
  NULL,
  f_fifo_select_open_position.id_sell_trade,
  0,
  FALSE,
  out_trade_details.tdate
FROM
  f_fifo_select_open_position (
    out_trade_details.idportfolio,
    out_trade_details.tidinstrument,
    out_trade_details.qty,
    out_trade_details.price,
    p_id_out_trade,
    p_tr_type_to_close
  )
RETURNING
  dtrades_allocated_fifo.id,
  dtrades_allocated_fifo.idtrade,
  dtrades_allocated_fifo.tr_type,
  dtrades_allocated_fifo.qty,
  dtrades_allocated_fifo.qty_out,
  dtrades_allocated_fifo.price_in,
  dtrades_allocated_fifo.price_out,
  dtrades_allocated_fifo.closed,
  dtrades_allocated_fifo.idportfolio,
  dtrades_allocated_fifo.trade_date,
  dtrades_allocated_fifo.secid,
  dtrades_allocated_fifo.profit_loss,
  dtrades_allocated_fifo.id_sell_trade,
  dtrades_allocated_fifo.id_buy_trade;
END;
$BODY$;

ALTER FUNCTION public.f_fifo_create_out_transactions(numeric, numeric)
    OWNER TO postgres;
