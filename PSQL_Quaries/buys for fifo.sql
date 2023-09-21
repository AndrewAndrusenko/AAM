SELECT dtrades_allocated_fifo.id, dtrades_allocated_fifo.trade_date,dtrades_allocated_fifo.idtrade, dtrades_allocated_fifo.tr_type, 
	dtrades_allocated_fifo.qty - COALESCE (dtrades_allocated_fifo.qty_out,0) as qty, dtrades_allocated_fifo.qty_out, dtrades_allocated_fifo.price_in, dtrades_allocated_fifo.price_out,
	dtrades_allocated_fifo.closed, dtrades_allocated_fifo.idportfolio
	FROM public.dtrades_allocated_fifo
	where dtrades_allocated_fifo.idportfolio=29 and dtrades_allocated_fifo.secid='GOOG-RM' and closed = false
	order by dtrades_allocated_fifo.trade_date,dtrades_allocated_fifo.id