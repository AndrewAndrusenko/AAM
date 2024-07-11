-- FUNCTION: public.f_fifo_create_sell_transactions(numeric, text, numeric, numeric, numeric)

-- DROP FUNCTION IF EXISTS public.f_fifo_create_sell_transactions(numeric, text, numeric, numeric, numeric);

CREATE OR REPLACE FUNCTION public.f_fifo_create_sell_transactions(
	p_idportfolio numeric,
	p_secid text,
	qty_to_sell numeric,
	sell_price numeric,
	p_id_sell_trade numeric)
    RETURNS TABLE(id bigint, idtrade bigint, tr_type smallint, qty numeric, qty_out numeric, price_in numeric, price_out numeric, closed boolean, idportfolio numeric, trade_date date, secid character varying, profit_loss numeric, id_sell_trade numeric, id_buy_trade numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN query
WITH
  inserted_sell AS (
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
      f_fifo_select_unsold_portfolio.trade_date,
      p_id_sell_trade,
      f_fifo_select_unsold_portfolio.tr_type,
      f_fifo_select_unsold_portfolio.qty,
      f_fifo_select_unsold_portfolio.qty_out,
      f_fifo_select_unsold_portfolio.price_in,
      f_fifo_select_unsold_portfolio.price_out,
      f_fifo_select_unsold_portfolio.idportfolio,
      f_fifo_select_unsold_portfolio.secid,
      f_fifo_select_unsold_portfolio.generated,
      f_fifo_select_unsold_portfolio.profit_loss,
      f_fifo_select_unsold_portfolio.id_sell_trade,
      f_fifo_select_unsold_portfolio.idtrade
    FROM
      f_fifo_select_unsold_portfolio (p_idportfolio, p_secid, qty_to_sell, sell_price, p_id_sell_trade)
    RETURNING *
  )
UPDATE dtrades_allocated_fifo fifo
SET
  qty_out = COALESCE(fifo.qty_out, 0) + inserted_sell.qty_out,
  closed = CASE
    WHEN COALESCE(fifo.qty_out, 0) + inserted_sell.qty_out = fifo.qty THEN TRUE
    ELSE FALSE
  END
FROM
  dtrades_allocated_fifo fifo1
  INNER JOIN inserted_sell ON fifo1.idtrade = inserted_sell.id_buy_trade
WHERE
	fifo.id = fifo1.id
RETURNING  
	inserted_sell.id ,
	inserted_sell.idtrade ,
	inserted_sell.tr_type ,
	inserted_sell.qty ,
	inserted_sell.qty_out ,
	inserted_sell.price_in ,
	inserted_sell.price_out ,
	inserted_sell.closed ,
	inserted_sell.idportfolio ,
	inserted_sell.trade_date ,
	inserted_sell.secid ,
	inserted_sell.profit_loss ,
	inserted_sell.id_sell_trade,
	inserted_sell.id_buy_trade;
END;
$BODY$;

ALTER FUNCTION public.f_fifo_create_sell_transactions(numeric, text, numeric, numeric, numeric)
    OWNER TO postgres;
