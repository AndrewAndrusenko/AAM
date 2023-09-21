with inserted_sell as (   
 INSERT INTO public.dtrades_allocated_fifo(
	 trade_date,idtrade, tr_type, qty, qty_out, price_in, price_out, idportfolio, secid, generated, profit_loss,id_sell_trade,id_buy_trade)

select trade_date,idtrade, tr_type, qty, qty_out, price_in, price_out, idportfolio,  secid, generated, profit_loss,id_sell_trade,id 
from f_fifo_select_unsold_portfolio (29,'GOOG-RM',19,300,120) RETURNING *)
update dtrades_allocated_fifo fifo
set qty_out = COALESCE (fifo.qty_out,0) + inserted_sell.qty_out,
closed = case when COALESCE (fifo.qty_out,0) + inserted_sell.qty_out = fifo.qty then true else false end 
from dtrades_allocated_fifo fifo1
 inner join inserted_sell on fifo1.id=inserted_sell.id_buy_trade
where fifo.id= fifo1.id returning *

-- select  COALESCE (dtrades_allocated_fifo.qty_out,0) + inserted_sell.qty_out as new_qty , * from dtrades_allocated_fifo
-- right join inserted_sell
-- on dtrades_allocated_fifo.id=inserted_sell.id_buy_trade
-- where dtrades_allocated_fifo.id_sell_trade isnull