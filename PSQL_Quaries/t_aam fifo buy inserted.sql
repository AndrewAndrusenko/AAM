SELECT id, idtrade, tr_type, qty, qty_out, price_in, price_out, closed, idportfolio, trade_date, secid, generated, profit_loss, id_sell_trade, id_buy_trade
	FROM public.dtrades_allocated_fifo
-- 	where id_buy_trade notnull
-- where idtrade=ANY(ARRAY[540,541])
-- where GENERATED::date ='09/20/2023' and tr_type=0
where idportfolio=29
-- where tr_type=1
	order by id desc
	
	