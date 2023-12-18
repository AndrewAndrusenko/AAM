SELECT out_date::date,
   dtrades_allocated_fifo.idportfolio,dtrades_allocated_fifo.secid,
  SUM(profit_loss) OVER (
	  PARTITION BY  dtrades_allocated_fifo.idportfolio,dtrades_allocated_fifo.secid
	  ORDER BY  dtrades_allocated_fifo.idportfolio,dtrades_allocated_fifo.secid,out_date::date asc
	  ROWS BETWEEN UNBOUNDED PRECEDING
	  AND CURRENT ROW)
FROM
  dtrades_allocated_fifo
WHERE
  dtrades_allocated_fifo.out_date <= now()
  and profit_loss notnull
