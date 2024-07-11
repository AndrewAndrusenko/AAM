-- FUNCTION: public.f_fifo_get_cost_current_positions(date, bigint[], numeric)

DROP FUNCTION IF EXISTS public.f_fifo_get_cost_pl_period_portfoilos_v2(date, char varying[]);

CREATE OR REPLACE FUNCTION public.f_fifo_get_cost_pl_period_portfoilos_v2(
	p_report_date date,
	p_portfolios_codes char varying[])
    RETURNS TABLE(
	portfolioname char varying,
	currency_code bigint,
	idportfolio numeric,
	secid char varying,
	fifo_change_date date,
	current_fifo_position_qty numeric,
	current_fifo_position_cost numeric,
	profit_loss numeric
	) 
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
  ),
 profit_loss_data_set AS (
	SELECT out_date::date,
	   dtrades_allocated_fifo.idportfolio,dtrades_allocated_fifo.secid,
	   ROW_NUMBER() OVER (
			PARTITION BY  dtrades_allocated_fifo.idportfolio,dtrades_allocated_fifo.secid
			ORDER BY  dtrades_allocated_fifo.idportfolio,dtrades_allocated_fifo.secid,out_date::date ASC
	   ) AS pl_rn,
	   SUM(dtrades_allocated_fifo.profit_loss) OVER (
		  PARTITION BY  dtrades_allocated_fifo.idportfolio,dtrades_allocated_fifo.secid
		  ORDER BY  dtrades_allocated_fifo.idportfolio,dtrades_allocated_fifo.secid,out_date::date asc
		  ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
	   ) AS pl
	FROM
	  dtrades_allocated_fifo
	WHERE
	  dtrades_allocated_fifo.out_date <= p_report_date
	  AND dtrades_allocated_fifo.profit_loss NOTNULL
	  AND dtrades_allocated_fifo.idportfolio = ANY (SELECT portfolios_dataset.idportfolio FROM portfolios_dataset)
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
		SUM(rest) as rest,
		SUM(cost_in) AS cost_in,
		SUM(qty) AS qty,
		SUM(qty_out) AS qty_out
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
	GROUP BY 
		af_main.idportfolio,
		af_main.secid,
		af_main.out_date
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
	ROUND(costs_full_set.cost_in,2) AS current_fifo_position_cost,
	COALESCE(pl_joined.pl,0) as profit_loss
FROM costs_full_set 
LEFT JOIN portfolios_dataset USING (idportfolio)
LEFT JOIN LATERAL (
	SELECT 
		profit_loss_data_set.out_date::date, 
		profit_loss_data_set.idportfolio, 
		profit_loss_data_set.secid, 
		profit_loss_data_set.pl
	FROM profit_loss_data_set
	WHERE 		
		profit_loss_data_set.idportfolio = costs_full_set.idportfolio
		AND profit_loss_data_set.secid = costs_full_set.secid
	    AND profit_loss_data_set.out_date<=costs_full_set.out_date
	ORDER BY profit_loss_data_set.out_date desc, profit_loss_data_set.pl_rn DESC
	LIMIT 1
) AS pl_joined ON TRUE;
END
$BODY$;

ALTER FUNCTION public.f_fifo_get_cost_pl_period_portfoilos_v2(date, char varying[])
    OWNER TO postgres;
SELECT * FROM f_fifo_get_cost_pl_period_portfoilos_v2(now()::date, array(
	select portfolioname from dportfolios
))
where secid='CSCO-RM'
and portfolioname='ACM002'
