-- FUNCTION: public.f_fifo_get_pl_positions_by_portfolio(date, bigint[])

DROP FUNCTION IF EXISTS public.f_fifo_get_pl_positions_by_portfolio(date, bigint[],numeric);

CREATE OR REPLACE FUNCTION public.f_fifo_get_pl_positions_by_portfolio(
	p_report_date date,
	p_idportfolios bigint[],
    p_report_currency numeric)
    RETURNS TABLE(
         cross_rate numeric, rate_date date,
		
		idportfolio numeric, secid character varying, pl numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN query
WITH portfolios_currency AS (
    SELECT
      "bAccounts".idportfolio,
      "bAccounts"."currencyCode"
    FROM
      "bAccounts"
    WHERE
      "bAccounts".idportfolio = ANY (p_idportfolios)
      AND "accountTypeExt" = 8
),
pl_dataset AS (
SELECT
   dtrades_allocated_fifo.idportfolio,dtrades_allocated_fifo.secid,
  SUM(profit_loss) AS pl
FROM
  dtrades_allocated_fifo
  LEFT JOIN dtrades_allocated ON dtrades_allocated.id = dtrades_allocated_fifo.idtrade
WHERE
  dtrades_allocated_fifo.out_date <= p_report_date
  AND
  dtrades_allocated_fifo.idportfolio = ANY(p_idportfolios)
GROUP BY
  dtrades_allocated_fifo.idportfolio,dtrades_allocated_fifo.secid
)
SELECT 
crossrates_dataset.cross_rate,crossrates_dataset.rate_date,
pl_dataset.idportfolio,pl_dataset.secid,coalesce(pl_dataset.pl,0)*crossrates_dataset.cross_rate as pl 
FROM pl_dataset
LEFT JOIN portfolios_currency ON portfolios_currency.idportfolio = pl_dataset.idportfolio
  LEFT JOIN LATERAL (
    SELECT
      *
    FROM
      f_i_get_cross_ratesfor_period_currencylist (
        ARRAY (
          SELECT DISTINCT
            "currencyCode"::BIGINT
          FROM
            portfolios_currency
        ),
        p_report_date,
        p_report_date,
        p_report_currency
      )
    WHERE
      f_i_get_cross_ratesfor_period_currencylist.base_code = portfolios_currency."currencyCode"
    ORDER BY
      f_i_get_cross_ratesfor_period_currencylist.rate_date DESC
    LIMIT
      1
  ) AS crossrates_dataset ON TRUE;
END
$BODY$;

ALTER FUNCTION public.f_fifo_get_pl_positions_by_portfolio(date, bigint[],numeric)
    OWNER TO postgres;
select * from f_fifo_get_pl_positions_by_portfolio(now()::date, array[11],810)