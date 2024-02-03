-- FUNCTION: public.f_fifo_select_pl_for_all_trades(date)

DROP FUNCTION IF EXISTS public.f_fifo_select_all_trades(numrange,numrange,daterange,numeric,text[],text[],numeric[]);

CREATE OR REPLACE FUNCTION public.f_fifo_select_all_trades(
	p_qty_range numrange,
	p_price_range numrange,
	p_date_out_range daterange,
	p_tr_type numeric,
	p_portfolios_list text[],
	p_secid text[],
	p_trades_ids numeric[]
)
    RETURNS TABLE(
		portfolioname char varying,secid char varying,
		out_date date,allocated_trade bigint,idtrade numeric ,tr_type text,rest_qty numeric,qty numeric,qty_out numeric,price_in numeric,
		price_out numeric,closed boolean,idportfolio numeric,trade_date date,id bigint,generated date,profit_loss numeric,
		id_sell_trade numeric,id_buy_trade numeric, position_type text)
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN query
SELECT
dportfolios.portfolioname,
dtrades_allocated_fifo.secid,
dtrades_allocated_fifo.out_date,dtrades_allocated_fifo.idtrade as allocated_trade,
dtrades_allocated.idtrade,
CASE 
WHEN dtrades_allocated_fifo.tr_type=1 THEN 'BUY'
WHEN dtrades_allocated_fifo.tr_type=-1 THEN 'SELL'
END as tr_type,
CASE 
WHEN dtrades_allocated_fifo.id_buy_trade>0 THEN 0
ELSE dtrades_allocated_fifo.qty - dtrades_allocated_fifo.qty_out
END as rest_qty,
CASE 
WHEN dtrades_allocated_fifo.id_buy_trade>0 THEN dtrades_allocated_fifo.qty_out
ELSE dtrades_allocated_fifo.qty
END as qty,
dtrades_allocated_fifo.qty_out,dtrades_allocated_fifo.price_in,dtrades_allocated_fifo.price_out,dtrades_allocated_fifo.closed,
dtrades_allocated_fifo.idportfolio,dtrades_allocated_fifo.trade_date,dtrades_allocated_fifo.id,dtrades_allocated_fifo.generated,
dtrades_allocated_fifo.profit_loss,dtrades_allocated_fifo.id_sell_trade,dtrades_allocated_fifo.id_buy_trade,
CASE 
WHEN dtrades_allocated_fifo.id_buy_trade>0 THEN 'Close'
ELSE 'Open'
END as position_type
FROM
  dtrades_allocated_fifo
  LEFT JOIN dportfolios USING (idportfolio)
  LEFT JOIN dtrades_allocated ON dtrades_allocated.id=dtrades_allocated_fifo.idtrade
WHERE
  (p_qty_range ISNULL OR  p_qty_range@>dtrades_allocated_fifo.qty_out) AND
  (p_price_range ISNULL OR  p_price_range@>dtrades_allocated_fifo.price_out) AND
  (p_date_out_range ISNULL OR  p_date_out_range@>dtrades_allocated_fifo.out_date) AND
  (p_tr_type ISNULL OR  p_tr_type=dtrades_allocated_fifo.tr_type) AND
  (p_secid ISNULL OR dtrades_allocated_fifo.secid=ANY(p_secid)) AND
  (p_portfolios_list ISNULL OR dportfolios.portfolioname=ANY(p_portfolios_list)) AND
  (p_trades_ids ISNULL OR 
		(dtrades_allocated_fifo.id_sell_trade=ANY(p_trades_ids) OR 
		 dtrades_allocated_fifo.id_buy_trade=ANY(p_trades_ids) OR
		 dtrades_allocated.idtrade=ANY(p_trades_ids)
		)
  )
  
ORDER BY dtrades_allocated_fifo.out_date DESC,dtrades_allocated_fifo.id_sell_trade,dtrades_allocated_fifo.qty_out,dtrades_allocated_fifo.id_buy_trade DESC;
END;
$BODY$;

ALTER FUNCTION public.f_fifo_select_all_trades(numrange,numrange,daterange,numeric, text[],text[],numeric[])
    OWNER TO postgres;
select * from f_fifo_select_all_trades(
	'(1,10)'::numrange,
-- 	null,
	null,null,1,null,null,null)
-- where secid='GOOG-RM' and portfolioname='VPI003'