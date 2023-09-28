-- FUNCTION: public.f_fifo_select_open_position(numeric, text, numeric, numeric, numeric)

-- DROP FUNCTION IF EXISTS public.f_fifo_select_open_position(numeric, text, numeric, numeric, numeric,numeric);

CREATE OR REPLACE FUNCTION public.f_fifo_select_open_position(
	p_idportfolio numeric,
	p_secid text,
	out_qty numeric,
	out_price numeric,
	p_idtrade numeric,
	p_tr_type_to_close numeric)
    RETURNS TABLE(id bigint, trade_date date, idtrade bigint, tr_type integer, qty numeric, qty_out numeric, price_in numeric, price_out numeric, profit_loss numeric, qty_total numeric, generated timestamp without time zone, secid text, idportfolio numeric, id_sell_trade numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN query
WITH
	fifo_open AS (
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
			AND dtrades_allocated_fifo.tr_type=p_tr_type_to_close
		ORDER BY
			dtrades_allocated_fifo.trade_date,
			dtrades_allocated_fifo.id
	),
	qty_running_total AS (
		SELECT
			*,
			SUM(fifo_open.qty) OVER (
				ORDER BY
					fifo_open.trade_date asc ROWS BETWEEN unbounded preceding
					AND CURRENT ROW
			) AS qty_total
		FROM
			fifo_open
	),
	record_above AS (
		SELECT
			*
		FROM
			qty_running_total
		WHERE
			qty_running_total.qty_total >= out_qty
		ORDER BY
			qty_running_total.qty_total asc
		LIMIT
			1
	)
SELECT
  qty_running_total.id,
  qty_running_total.trade_date,
  qty_running_total.idtrade,
  p_tr_type_to_close*-1 AS tr_type,
  qty_running_total.qty,
  CASE
    WHEN qty_running_total.qty_total <= out_qty THEN qty_running_total.qty
    ELSE qty_running_total.qty - qty_running_total.qty_total + out_qty
  END AS qty_sold,
  qty_running_total.price_in,
  out_price AS price_out,
  ROUND(
    (out_price - qty_running_total.price_in) * (
      CASE
        WHEN qty_running_total.qty_total <= out_qty THEN qty_running_total.qty
        ELSE qty_running_total.qty - qty_running_total.qty_total + out_qty
      END
    )::NUMERIC,
    2
  ) AS profit_loss,
  qty_running_total.qty_total,
  NOW()::TIMESTAMP WITHOUT TIME ZONE AS GENERATED,
  p_secid AS secid,
  p_idportfolio AS idportfolio,
  p_idtrade AS id_sell_trade
FROM
  qty_running_total
WHERE
  qty_running_total.qty_total <= out_qty
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

ALTER FUNCTION public.f_fifo_select_open_position(numeric, text, numeric, numeric, numeric,numeric)
    OWNER TO postgres;
