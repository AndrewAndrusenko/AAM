    SELECT DISTINCT
      ON (idtrade) idtrade,
      dtrades_allocated_fifo.idportfolio,
      dtrades_allocated_fifo.secid,
      dtrades_allocated_fifo.qty,
      dtrades_allocated_fifo.qty_out,
      (dtrades_allocated_fifo.qty - dtrades_allocated_fifo.qty_out) * dtrades_allocated_fifo.tr_type AS rest,
      (dtrades_allocated_fifo.qty - dtrades_allocated_fifo.qty_out) * dtrades_allocated_fifo.tr_type * dtrades_allocated_fifo.price_in 
	  AS cost_in,
	  ABS(dtrades_allocated_fifo.qty  * dtrades_allocated_fifo.tr_type * dtrades_allocated_fifo.price_in)  AS cost_fulll
    FROM
      public.dtrades_allocated_fifo
    WHERE
      dtrades_allocated_fifo.out_date <= now()
      AND id_buy_trade = 0
      AND dtrades_allocated_fifo.idportfolio = ANY(array[25])
	  AND secid='RU000A0JXTS9'
    ORDER BY
      idtrade,
      dtrades_allocated_fifo.trade_date,
      qty - qty_out