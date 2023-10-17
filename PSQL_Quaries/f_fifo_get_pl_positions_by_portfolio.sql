-- FUNCTION: public.f_fifo_get_cost_current_positions(date, bigint[])

-- DROP FUNCTION IF EXISTS public.f_fifo_get_pl_positions_by_portfolio(date, bigint[]);

CREATE OR REPLACE FUNCTION public.f_fifo_get_pl_positions_by_portfolio(
	p_report_date date,
	p_idportfolios bigint[])
    RETURNS TABLE(idportfolio numeric, secid character varying, "position" numeric, cost_in_position numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN query
SELECT
   dtrades_allocated_fifo.idportfolio,dtrades_allocated_fifo.secid,
  SUM(profit_loss) AS pl
FROM
  dtrades_allocated_fifo
  LEFT JOIN dtrades_allocated ON dtrades_allocated.id = dtrades_allocated_fifo.idtrade
WHERE
  dtrades_allocated_fifo.out_date <= p_report_date
  AND id_buy_trade = 0
  AND dtrades_allocated_fifo.idportfolio = ANY(p_idportfolios)
GROUP BY
  dtrades_allocated_fifo.idportfolio,dtrades_allocated_fifo.secid;
END
$BODY$;

ALTER FUNCTION public.f_fifo_get_pl_positions_by_portfolio(date, bigint[])
    OWNER TO postgres;
