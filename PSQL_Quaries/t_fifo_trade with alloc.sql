SELECT id, accounted_trades.e_qty,qty, dtrades_allocated.idtrade, idportfolio, id_order, id_bulk_order
	FROM public.dtrades_allocated
	left join 
	(select idtrade, count(id) as e_qty from "bAccountTransaction"  where "bAccountTransaction".idtrade NOTNULL GROUP by idtrade) 
	as accounted_trades on accounted_trades.idtrade=dtrades_allocated.id
	where e_qty notnull