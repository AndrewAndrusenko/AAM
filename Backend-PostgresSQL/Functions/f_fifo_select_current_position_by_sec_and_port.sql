-- FUNCTION: public.f_fifo_select_unsold_portfolio(numeric, text, numeric, numeric, numeric)

DROP FUNCTION IF EXISTS public.f_fifo_select_current_position_by_sec_and_port(text, text);

CREATE OR REPLACE FUNCTION public.f_fifo_select_current_position_by_sec_and_port(
	p_idportfolio_name text,
	p_secid text)
    RETURNS TABLE(
	  row_type text,
      trade_date date,
      idtrade bigint,
      closed boolean,
      id_buy_trade numeric,
      id_sell_trade numeric,
      tr_type int,
      "position" numeric,
      qty numeric,
      qty_out numeric,
      profit_loss numeric
	) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN query
WITH
  fifo_portfolio AS (
    SELECT
      'Deal' AS row_type,
      dtrades_allocated_fifo.trade_date,
      dtrades_allocated_fifo.idtrade,
      dtrades_allocated_fifo.closed,
      dtrades_allocated_fifo.id_buy_trade,
      dtrades_allocated_fifo.id_sell_trade,
      dtrades_allocated_fifo.tr_type,
      CASE
        WHEN dtrades_allocated_fifo.closed = FALSE THEN dtrades_allocated_fifo.qty - dtrades_allocated_fifo.qty_out
        ELSE 0
      END AS POSITION,
      dtrades_allocated_fifo.qty,
      dtrades_allocated_fifo.qty_out,
      dtrades_allocated_fifo.profit_loss
    FROM
      public.dtrades_allocated_fifo
      LEFT JOIN dportfolios ON dportfolios.idportfolio = dtrades_allocated_fifo.idportfolio
    WHERE
      dportfolios.portfolioname = UPPER(p_idportfolio_name)
      AND dtrades_allocated_fifo.secid = p_secid
    ORDER BY
      dtrades_allocated_fifo.tr_type,
      dtrades_allocated_fifo.trade_date
  )
SELECT
  *
FROM
  fifo_portfolio
UNION
SELECT
  'Total',
  NOW()::date,
  0,
  FALSE,
  0,
  0,
  0,
  SUM(fifo_portfolio.POSITION),
  0,
  0,
  0
FROM
  fifo_portfolio
ORDER BY
  row_type,
  tr_type,
  trade_date;
END;
$BODY$;

ALTER FUNCTION public.f_fifo_select_current_position_by_sec_and_port(text, text)
    OWNER TO postgres;
