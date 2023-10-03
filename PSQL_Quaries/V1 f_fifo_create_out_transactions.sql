-- FUNCTION: public.f_fifo_create_out_transactions(numeric, text, numeric, numeric, numeric, numeric)

-- DROP FUNCTION IF EXISTS public.f_fifo_create_out_transactions(numeric, text, numeric, numeric, numeric, numeric);

CREATE OR REPLACE FUNCTION public.f_fifo_create_out_transactions(
	p_idportfolio numeric,
	p_secid text,
	qty_to_sell numeric,
	sell_price numeric,
	p_id_sell_trade numeric,
	p_tr_type_to_close numeric)
    RETURNS TABLE(id bigint, idtrade bigint, tr_type smallint, qty numeric, qty_out numeric, price_in numeric, price_out numeric, closed boolean, idportfolio numeric, trade_date date, secid character varying, profit_loss numeric, id_sell_trade numeric, id_buy_trade numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN query
WITH
  inserted_out_transactions AS (
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
        generated,
        profit_loss,
        id_sell_trade,
        id_buy_trade
      )
    SELECT
      f_fifo_select_open_position.trade_date,
      p_id_sell_trade,
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
      f_fifo_select_open_position.idtrade
    FROM
      f_fifo_select_open_position (p_idportfolio, p_secid, qty_to_sell, sell_price, p_id_sell_trade,p_tr_type_to_close)
    RETURNING *
  )
UPDATE dtrades_allocated_fifo fifo
SET
  qty_out = COALESCE(fifo.qty_out, 0) + inserted_out_transactions.qty_out,
  closed = CASE
    WHEN COALESCE(fifo.qty_out, 0) + inserted_out_transactions.qty_out = fifo.qty THEN TRUE
    ELSE FALSE
  END
FROM
  dtrades_allocated_fifo fifo1
  INNER JOIN inserted_out_transactions ON fifo1.idtrade = inserted_out_transactions.id_buy_trade
WHERE
	fifo.id = fifo1.id AND fifo.id_sell_trade=0
RETURNING  
	inserted_out_transactions.id ,
	inserted_out_transactions.idtrade ,
	inserted_out_transactions.tr_type ,
	inserted_out_transactions.qty ,
	inserted_out_transactions.qty_out ,
	inserted_out_transactions.price_in ,
	inserted_out_transactions.price_out ,
	inserted_out_transactions.closed ,
	inserted_out_transactions.idportfolio ,
	inserted_out_transactions.trade_date ,
	inserted_out_transactions.secid ,
	inserted_out_transactions.profit_loss ,
	inserted_out_transactions.id_sell_trade,
	inserted_out_transactions.id_buy_trade;
END;
$BODY$;

ALTER FUNCTION public.f_fifo_create_out_transactions(numeric, text, numeric, numeric, numeric, numeric)
    OWNER TO postgres;
