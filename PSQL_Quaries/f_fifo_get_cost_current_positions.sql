-- FUNCTION: public.f_fifo_get_cost_current_positions(date, bigint[])

-- DROP FUNCTION IF EXISTS public.f_fifo_get_cost_current_positions(date, bigint[]);

CREATE OR REPLACE FUNCTION public.f_fifo_get_cost_current_positions(
	p_report_date date,
	p_idportfolios bigint[])
    RETURNS TABLE(idportfolio numeric, secid character varying, "position" numeric, cost_in_position numeric,cost_full_position numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN query
SELECT
  positions.idportfolio,
  positions.secid,
  SUM(rest) AS POSITION,
  ROUND(SUM(cost_in), 2) AS cost_in_position,
  ROUND(SUM(cost_fulll), 2) AS cost_full_position
FROM
  (
    SELECT DISTINCT
      ON (idtrade) idtrade,
      dtrades_allocated_fifo.idportfolio,
      dtrades_allocated_fifo.secid,
      dtrades_allocated_fifo.qty,
      dtrades_allocated_fifo.qty_out,
      (dtrades_allocated_fifo.qty - dtrades_allocated_fifo.qty_out) * dtrades_allocated_fifo.tr_type AS rest,
      (dtrades_allocated_fifo.qty - dtrades_allocated_fifo.qty_out) * dtrades_allocated_fifo.tr_type * dtrades_allocated_fifo.price_in AS cost_in,
	  ABS(dtrades_allocated_fifo.qty  * dtrades_allocated_fifo.tr_type * dtrades_allocated_fifo.price_in)  AS cost_fulll
    FROM
      public.dtrades_allocated_fifo
    WHERE
      dtrades_allocated_fifo.out_date <= p_report_date
      AND id_buy_trade = 0
      AND dtrades_allocated_fifo.idportfolio = ANY(p_idportfolios)
    ORDER BY
      idtrade,
      dtrades_allocated_fifo.trade_date,
      qty - qty_out
  ) AS positions
-- WHERE
--   rest != 0
GROUP BY
  positions.idportfolio,
  positions.secid;
END
$BODY$;

ALTER FUNCTION public.f_fifo_get_cost_current_positions(date, bigint[])
    OWNER TO postgres;
