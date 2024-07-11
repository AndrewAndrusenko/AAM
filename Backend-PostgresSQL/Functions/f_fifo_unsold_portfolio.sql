
-- DROP FUNCTION IF EXISTS public.f_fifo_select_unsold_portfolio(numeric, text, numeric,numeric,numeric);

CREATE
OR REPLACE FUNCTION public.f_fifo_select_unsold_portfolio (
  p_idportfolio NUMERIC,
  p_secid TEXT,
  qty_to_sell NUMERIC,
  sell_price NUMERIC,
  p_id_sell_trade NUMERIC
) RETURNS TABLE (
  id BIGINT,
  trade_date date,
  idtrade BIGINT,
  tr_type INT,
  qty NUMERIC,
  qty_out NUMERIC,
  price_in NUMERIC,
  price_out NUMERIC,
  profit_loss NUMERIC,
  qty_total NUMERIC,
  GENERATED TIMESTAMP,
  secid TEXT,
  idportfolio NUMERIC,
  id_sell_trade NUMERIC
) LANGUAGE 'plpgsql' COST 100 VOLATILE PARALLEL UNSAFE ROWS 1000

AS $BODY$
BEGIN
RETURN query
WITH
	fifo_buy AS (
		SELECT
			dtrades_allocated_fifo.id,
			dtrades_allocated_fifo.trade_date,
			dtrades_allocated_fifo.idtrade,
			dtrades_allocated_fifo.tr_type,
			dtrades_allocated_fifo.qty - COALESCE(dtrades_allocated_fifo.qty_out, 0) AS qty,
			dtrades_allocated_fifo.qty_out,
			dtrades_allocated_fifo.price_in,
			dtrades_allocated_fifo.price_out,
			dtrades_allocated_fifo.closed,
			dtrades_allocated_fifo.idportfolio
		FROM
			public.dtrades_allocated_fifo
		WHERE
			dtrades_allocated_fifo.idportfolio = p_idportfolio
			AND dtrades_allocated_fifo.secid = p_secid
			AND closed != TRUE
		ORDER BY
			dtrades_allocated_fifo.trade_date,
			dtrades_allocated_fifo.id
	),
	qty_running_total AS (
		SELECT
			*,
			SUM(fifo_buy.qty) OVER (
				ORDER BY
					fifo_buy.trade_date asc ROWS BETWEEN unbounded preceding
					AND CURRENT ROW
			) AS qty_total
		FROM
			fifo_buy
	),
	record_above AS (
		SELECT
			*
		FROM
			qty_running_total
		WHERE
			qty_running_total.qty_total >= qty_to_sell
		ORDER BY
			qty_running_total.qty_total asc
		LIMIT
			1
	)
SELECT
  qty_running_total.id,
  qty_running_total.trade_date,
  qty_running_total.idtrade,
  1 AS tr_type,
  qty_running_total.qty,
  CASE
    WHEN qty_running_total.qty_total <= qty_to_sell THEN qty_running_total.qty
    ELSE qty_running_total.qty - qty_running_total.qty_total + qty_to_sell
  END AS qty_sold,
  qty_running_total.price_in,
  sell_price AS price_out,
  ROUND(
    (sell_price - qty_running_total.price_in) * (
      CASE
        WHEN qty_running_total.qty_total <= qty_to_sell THEN qty_running_total.qty
        ELSE qty_running_total.qty - qty_running_total.qty_total + qty_to_sell
      END
    )::NUMERIC,
    2
  ) AS profit_loss,
  qty_running_total.qty_total,
  NOW()::TIMESTAMP WITHOUT TIME ZONE AS GENERATED,
  p_secid AS secid,
  p_idportfolio AS idportfolio,
  p_id_sell_trade AS id_sell_trade
FROM
  qty_running_total
WHERE
  qty_running_total.qty_total <= qty_to_sell
  OR qty_running_total.id = (
    SELECT
      record_above.id
    FROM
      record_above
  )
ORDER BY
  qty_running_total.trade_date,
  qty_running_total.id;

END;
$BODY$;

ALTER FUNCTION public.f_fifo_select_unsold_portfolio(numeric, text, numeric,numeric,numeric)
    OWNER TO postgres;
