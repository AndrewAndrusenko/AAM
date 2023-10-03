SELECT 
 positions.idportfolio,
  SUM(rest) AS POSITION
FROM
  (
    SELECT DISTINCT
      ON (idtrade) idtrade,
      idportfolio,
      qty,
      qty_out,
      qty - qty_out AS rest
    FROM
      public.dtrades_allocated_fifo
    WHERE
      dtrades_allocated_fifo.secid = 'GOOG-RM'
      AND id_buy_trade = 0
      AND dtrades_allocated_fifo.idportfolio = ANY (select idportfolio from dtrades_allocated where idtrade=116)
    ORDER BY
      idtrade,
      dtrades_allocated_fifo.trade_date,
      qty - qty_out
  ) AS positions
WHERE
  rest > 0
GROUP BY
  positions.idportfolio