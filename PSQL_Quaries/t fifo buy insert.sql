INSERT INTO public.dtrades_allocated_fifo(
	idtrade, tr_type, qty, qty_out, price_in, price_out, closed,idportfolio,trade_date)
	SELECT id,0, dtrades_allocated.qty,0, dtrades.trade_amount/dtrades.qty,0,false,dtrades_allocated.idportfolio,dtrades.tdate
	FROM public.dtrades_allocated
	left join 
	(select idtrade, count(id) as e_qty from "bAccountTransaction"  where "bAccountTransaction".idtrade NOTNULL GROUP by idtrade) 
	as accounted_trades on accounted_trades.idtrade=dtrades_allocated.id
	left join dtrades on dtrades.idtrade = dtrades_allocated.idtrade
	where e_qty notnull RETURNING *