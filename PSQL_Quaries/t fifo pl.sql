SELECT
  dtrades_allocated_fifo.idtrade,
  SUM(profit_loss) AS pl
FROM
  dtrades_allocated_fifo
  LEFT JOIN dtrades_allocated ON dtrades_allocated.id = dtrades_allocated_fifo.idtrade
WHERE
  dtrades_allocated.idtrade = 123
  AND profit_loss NOTNULL
GROUP BY
  dtrades_allocated_fifo.idtrade