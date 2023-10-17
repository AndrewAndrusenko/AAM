SELECT
   dtrades_allocated_fifo.idportfolio,dtrades_allocated_fifo.secid,
  SUM(profit_loss) AS pl
FROM
  dtrades_allocated_fifo
  LEFT JOIN dtrades_allocated ON dtrades_allocated.id = dtrades_allocated_fifo.idtrade
-- WHERE
--   dtrades_allocated.idtrade = p_idtrade
--   AND
--   profit_loss NOTNULL
GROUP BY
  dtrades_allocated_fifo.idportfolio,dtrades_allocated_fifo.secid;