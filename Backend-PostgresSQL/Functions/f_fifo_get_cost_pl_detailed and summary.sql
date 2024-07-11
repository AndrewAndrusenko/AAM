-- FUNCTION: public.f_fifo_get_cost_pl_period_portfoilos_v2(date, character varying[])

DROP FUNCTION IF EXISTS public.f_fifo_get_cost_pl_detailed_data(date, character varying[]);

CREATE OR REPLACE FUNCTION public.f_fifo_get_cost_pl_detailed_data(
	p_report_date date,
	p_portfolios_codes character varying[])
    RETURNS TABLE(portfolioname character varying, currency_code bigint, idportfolio numeric, secid character varying, fifo_change_date date, current_fifo_position_qty numeric, current_fifo_position_cost numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN QUERY
WITH 
  portfolios_dataset AS (
    SELECT
      "bAccounts".idportfolio,
      "bAccounts"."currencyCode" AS currency_code,
	  dportfolios.portfolioname
    FROM
      "bAccounts"
	LEFT JOIN dportfolios USING (idportfolio)
    WHERE
      dportfolios.portfolioname = ANY (p_portfolios_codes)
      AND "accountTypeExt" = 8
  ), fifo_changed_dates AS (
	SELECT 
		out_date,
		dtrades_allocated_fifo.idportfolio,
		dtrades_allocated_fifo.secid
	FROM public.dtrades_allocated_fifo 
	 WHERE
		dtrades_allocated_fifo.out_date <= p_report_date
		AND id_buy_trade = 0
		AND dtrades_allocated_fifo.idportfolio = ANY (SELECT portfolios_dataset.idportfolio FROM portfolios_dataset)
	GROUP BY 
		dtrades_allocated_fifo.out_date,
		dtrades_allocated_fifo.idportfolio,
		dtrades_allocated_fifo.secid
 ), costs_full_set AS (
	SELECT 
		af_main.idportfolio,
		af_main.secid,
		af_main.out_date,
		af_main.rest,
		af_main.cost_in,
		af_main.qty,
		af_main.qty_out
	FROM fifo_changed_dates  AS af_main
	LEFT JOIN LATERAL (
		SELECT
			DISTINCT  ON (idtrade) 
			idtrade,
			dtrades_allocated_fifo.idportfolio,
			dtrades_allocated_fifo.profit_loss,
			dtrades_allocated_fifo.secid,
			dtrades_allocated_fifo.qty,
			dtrades_allocated_fifo.qty_out,
			(dtrades_allocated_fifo.qty - dtrades_allocated_fifo.qty_out) * dtrades_allocated_fifo.tr_type AS rest,
			(dtrades_allocated_fifo.qty - dtrades_allocated_fifo.qty_out) * dtrades_allocated_fifo.tr_type * dtrades_allocated_fifo.price_in AS cost_in
		FROM
		  public.dtrades_allocated_fifo
		WHERE
		  dtrades_allocated_fifo.out_date <= af_main.out_date
		  AND id_buy_trade = 0
		  AND dtrades_allocated_fifo.idportfolio = af_main.idportfolio
		  AND dtrades_allocated_fifo.secid = af_main.secid
		ORDER BY
		  idtrade,
		  dtrades_allocated_fifo.trade_date,
		  qty - qty_out
	) AS af_joined ON TRUE
-- 	GROUP BY 
-- 		af_main.idportfolio,
-- 		af_main.secid,
-- 		af_main.out_date
	ORDER BY
		af_main.idportfolio,
		af_main.secid,
		af_main.out_date
)
SELECT 
	portfolios_dataset.portfolioname,
	portfolios_dataset.currency_code::bigint,
	costs_full_set.idportfolio,
	costs_full_set.secid,
	costs_full_set.out_date AS fifo_change_date,
	costs_full_set.rest AS current_fifo_position_qty,
	ROUND(costs_full_set.cost_in,2) AS current_fifo_position_cost
FROM costs_full_set 
LEFT JOIN portfolios_dataset USING (idportfolio);
END
$BODY$;

ALTER FUNCTION public.f_fifo_get_cost_pl_detailed_data(date, character varying[])
    OWNER TO postgres;
	
SELECT * from public.f_fifo_get_cost_pl_detailed_data(
now()::date, 
	array(select portfolioname from dportfolios)
)
where portfolioname='ACM002' and secid='GOOG-RM'
