-- FUNCTION: public.f_fifo_change_position_sign(numeric, numeric)

-- DROP FUNCTION IF EXISTS public.f_fifo_change_position_sign(numeric, numeric);

CREATE OR REPLACE FUNCTION public.f_fifo_change_position_sign(
	trade_id numeric,
	trade_qty numeric)
    RETURNS TABLE(idportfolio bigint) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
DECLARE 
sold_qty numeric;
BEGIN
SELECT
  trade_qty - COALESCE(SUM(dtrades_allocated_fifo.qty_out), 0) INTO sold_qty
FROM
  public.dtrades_allocated_fifo
WHERE
  dtrades_allocated_fifo.id_sell_trade = trade_id
  AND closed ISNULL;

IF sold_qty > 0 THEN RETURN QUERY
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
    GENERATED,
    secid,
    id_sell_trade,
    out_date
  )
SELECT
  dtrades_allocated.id,
  CASE dtrades.trtype
    WHEN 'BUY' THEN 1
    ELSE -1
  END,
  sold_qty,
  0,
  dtrades.trade_amount / dtrades.qty,
  0,
  FALSE,
  dtrades_allocated.idportfolio,
  dtrades.tdate,
  NOW(),
  dtrades.tidinstrument,
  0,
  dtrades.tdate
FROM
  public.dtrades_allocated
  LEFT JOIN dtrades ON dtrades.idtrade = dtrades_allocated.idtrade
WHERE
  dtrades_allocated.id = trade_id
RETURNING
  dtrades_allocated_fifo.id;

END IF;
END;
$BODY$;

ALTER FUNCTION public.f_fifo_change_position_sign(numeric, numeric)
    OWNER TO postgres;
