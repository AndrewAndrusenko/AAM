SELECT DISTINCT
  ON (idportfolio) idportfolio,
  CASE
    WHEN id_sell_trade != 0 THEN id_sell_trade
    ELSE idtrade
  END AS id_last_trade,
  id_sell_trade,
  id_buy_trade,
  *
FROM
  dtrades_allocated_fifo
ORDER BY
  idportfolio DESC,
  id DESC