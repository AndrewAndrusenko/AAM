		SELECT
		    DISTINCT ON (idtrade) dtrades_allocated_fifo.idtrade as t1,
			dtrades_allocated_fifo.id,
			dtrades_allocated_fifo.trade_date,
			dtrades_allocated_fifo.idtrade,
			dtrades_allocated_fifo.tr_type,
			dtrades_allocated_fifo.qty - dtrades_allocated_fifo.qty_out AS rest,
			dtrades_allocated_fifo.qty_out,
			dtrades_allocated_fifo.price_in,
			dtrades_allocated_fifo.price_out,
			dtrades_allocated_fifo.closed,
			dtrades_allocated_fifo.idportfolio
		FROM
			public.dtrades_allocated_fifo
		WHERE
			dtrades_allocated_fifo.idportfolio = 2
			AND dtrades_allocated_fifo.secid = 'GOOG-RM'
			AND dtrades_allocated_fifo.tr_type=1
		order by idtrade, out_date desc, qty asc, qty_out desc

