with last_fifo as (SELECT 
trade_date,  qty,qty_out, qty-qty_out as rest
FROM
  public.dtrades_allocated_fifo
WHERE
  dtrades_allocated_fifo.secid = 'GOOG-RM' AND id_buy_trade=0
  and idportfolio=2
  and qty-qty_out=0
ORDER BY idtrade,dtrades_allocated_fifo.trade_date,qty-qty_out) 
SELECT 
DISTINCT ON (idtrade) idtrade,  qty,qty_out, qty-qty_out as rest
FROM
  public.dtrades_allocated_fifo
WHERE
   trade_date>(select trade_date from last_fifo limit 1) and
--   dtrades_allocated_fifo.idportfolio = ANY(p_idportfolio)
--   AND 
  dtrades_allocated_fifo.secid = 'GOOG-RM' AND id_buy_trade=0
  and idportfolio=2
ORDER BY idtrade,dtrades_allocated_fifo.trade_date,qty-qty_out
