SELECT
  positions.idportfolio,
  secid,
  SUM(rest) AS POSITION,
  SUM(cost_in)::money AS cost_in_position
FROM
  (
    SELECT DISTINCT
      ON (idtrade) idtrade,
      dtrades_allocated_fifo.idportfolio,
	  secid,
      qty,
      qty_out,
      (qty - qty_out)*tr_type AS rest,
      (qty - qty_out)*tr_type*price_in AS cost_in
	  
    FROM
      public.dtrades_allocated_fifo
    WHERE
--       dtrades_allocated_fifo.secid = 'GOOG-RM'
--       AND 
	  id_buy_trade = 0
--       AND dtrades_allocated_fifo.idportfolio = 2
    ORDER BY
      idtrade,
      dtrades_allocated_fifo.trade_date,
      qty - qty_out
  ) AS positions
WHERE
  rest != 0
GROUP BY
  positions.idportfolio,secid;