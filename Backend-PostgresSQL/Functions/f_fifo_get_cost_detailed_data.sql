-- FUNCTION: public.f_fifo_get_cost_detailed_data(date, character varying[], character varying[])

-- DROP FUNCTION IF EXISTS public.f_fifo_get_cost_detailed_data(date, character varying[], character varying[]);

CREATE OR REPLACE FUNCTION public.f_fifo_get_cost_detailed_data(
	p_report_date date,
	p_portfolios_codes character varying[],
	p_secids character varying[])
    RETURNS TABLE(trade_date date, idtrade bigint, ext_trade numeric, idportfolio numeric, portfolioname character varying, secid character varying, fifo_rest numeric, fifo_cost numeric, price_in numeric, qty numeric, qty_out numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
IF p_report_date isnull THEN p_report_date=CURRENT_DATE; END IF;
RETURN QUERY
WITH
  fifo_set AS (
    SELECT DISTINCT
      ON (dtrades_allocated_fifo.idtrade) dtrades_allocated_fifo.out_date,
      dtrades_allocated_fifo.trade_date,
      dtrades_allocated_fifo.idtrade,
      dtrades_allocated_fifo.idportfolio,
	  dportfolios.portfolioname,
      dtrades_allocated_fifo.secid,
      dtrades_allocated_fifo.qty,
      dtrades_allocated_fifo.qty_out,
	  dtrades_allocated_fifo.price_in,
      (
        dtrades_allocated_fifo.qty - dtrades_allocated_fifo.qty_out
      ) * dtrades_allocated_fifo.tr_type AS rest,
      (
        dtrades_allocated_fifo.qty - dtrades_allocated_fifo.qty_out
      ) * dtrades_allocated_fifo.tr_type * dtrades_allocated_fifo.price_in AS cost_in
    FROM
      public.dtrades_allocated_fifo
	LEFT JOIN dportfolios USING (idportfolio)
    WHERE
	  dtrades_allocated_fifo.out_date <= p_report_date
      AND id_buy_trade = 0
	  AND (p_portfolios_codes ISNULL OR (dportfolios.portfolioname = ANY(p_portfolios_codes)))
	  AND (p_secids ISNULL OR (dtrades_allocated_fifo.secid = ANY(p_secids)))
    ORDER BY
      dtrades_allocated_fifo.idtrade,
      dtrades_allocated_fifo.idportfolio,
      dtrades_allocated_fifo.secid,
      dtrades_allocated_fifo.out_date DESC,
			(( dtrades_allocated_fifo.qty - dtrades_allocated_fifo.qty_out) * dtrades_allocated_fifo.tr_type) ASC
  )
SELECT
  fifo_set.trade_date,
  fifo_set.idtrade,
  dtrades_allocated.idtrade AS ext_trade,
  fifo_set.idportfolio,
  fifo_set.portfolioname,
  fifo_set.secid,
  SUM(fifo_set.rest) AS fifo_rest,
  SUM(ROUND(fifo_set.cost_in,2)) AS fifo_cost,
  fifo_set.price_in,
  fifo_set.qty,
  fifo_set.qty_out
FROM
  fifo_set
  LEFT JOIN dtrades_allocated ON fifo_set.idtrade=dtrades_allocated.id
WHERE 
	  ABS(fifo_set.rest)>0

GROUP BY
  GROUPING SETS (
    (
      fifo_set.trade_date,
      fifo_set.out_date,
      fifo_set.idtrade,
	  dtrades_allocated.idtrade,
      fifo_set.idportfolio,
	  fifo_set.portfolioname,
      fifo_set.secid,
      fifo_set.qty,
      fifo_set.qty_out,
      fifo_set.rest,
      fifo_set.cost_in,
	  fifo_set.price_in
    ),
    (fifo_set.idportfolio,   fifo_set.portfolioname,fifo_set.secid)
  )
ORDER BY
  fifo_set.idportfolio,
  fifo_set.secid,
  fifo_set.out_date DESC NULLS FIRST,
  fifo_set.trade_date ASC
  ;
END
$BODY$;

ALTER FUNCTION public.f_fifo_get_cost_detailed_data(date, character varying[], character varying[])
    OWNER TO postgres;
SELECT * FROM f_fifo_get_cost_detailed_data ('12/01/2023',array['CLEARALL','ACM002'],array['AAPL-RM'])