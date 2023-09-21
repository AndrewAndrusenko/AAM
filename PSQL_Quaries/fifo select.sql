-- UPDATE public.dtrades_allocated_fifo
-- 	SET
-- 	trade_date='01/07/2023'
-- 	WHERE id<130
-- select * from public.dtrades_allocated_fifo tr_type=1
-- delete from public.dtrades_allocated_fifo where tr_type=1;
-- update dtrades_allocated_fifo set qty_out = null ;

-- select * from dtrades_allocated_fifo where qty_out notnull and id_buy_trade notnull 
-- union
-- select id_sell_trade, sum(qty_out) as sum_qty,null,null,null,null,null,null,null,null,null,null,null,null,null from dtrades_allocated_fifo where qty_out notnull and id_buy_trade notnull group by id_sell_trade order by id asc

select * from dtrades_allocated_fifo where qty_out notnull and id_sell_trade isnull