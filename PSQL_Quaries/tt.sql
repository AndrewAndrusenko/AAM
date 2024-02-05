WITH
  fifo_set AS (
    SELECT DISTINCT
      ON (idtrade) dtrades_allocated_fifo.out_date,
      dtrades_allocated_fifo.trade_date,
      idtrade,
      dtrades_allocated_fifo.idportfolio,
      dtrades_allocated_fifo.secid,
      dtrades_allocated_fifo.qty,
      dtrades_allocated_fifo.qty_out,
      (
        dtrades_allocated_fifo.qty - dtrades_allocated_fifo.qty_out
      ) * dtrades_allocated_fifo.tr_type AS rest,
      (
        dtrades_allocated_fifo.qty - dtrades_allocated_fifo.qty_out
      ) * dtrades_allocated_fifo.tr_type * dtrades_allocated_fifo.price_in AS cost_in
    FROM
      public.dtrades_allocated_fifo
    WHERE
      idportfolio = 11
      AND dtrades_allocated_fifo.out_date <= '11/07/2023'
      AND id_buy_trade = 0
    ORDER BY
      idtrade,
      dtrades_allocated_fifo.idportfolio,
      dtrades_allocated_fifo.secid,
      dtrades_allocated_fifo.out_date DESC
  )
SELECT
  trade_date,
  idtrade,
  idportfolio,
  secid,
  SUM(rest)::money AS fifo_rest,
  SUM(cost_in)::money AS fifo_cost,
  rest,
  qty,
  qty_out
FROM
  fifo_set
GROUP BY
  GROUPING SETS (
    (
      fifo_set.trade_date,
      fifo_set.out_date,
      fifo_set.idtrade,
      fifo_set.idportfolio,
      fifo_set.secid,
      fifo_set.qty,
      fifo_set.qty_out,
      fifo_set.rest,
      fifo_set.cost_in
    ),
    (fifo_set.idportfolio, fifo_set.secid)
  )
ORDER BY
  idportfolio,
  secid,
  out_date DESC NULLS FIRST