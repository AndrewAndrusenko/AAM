-- FUNCTION: public.f_fifo_get_cost_current_positions(date, bigint[])

-- DROP FUNCTION IF EXISTS public.v2f_fifo_get_cost_current_positions(date, bigint[],numeric);

CREATE OR REPLACE FUNCTION public.v2f_fifo_get_cost_current_positions(
	p_report_date date,
	p_idportfolios bigint[],
    p_report_currency numeric)
    RETURNS TABLE(cross_rate numeric,rate_date date, idportfolio numeric, secid character varying, "position" numeric, cost_in_position numeric, cost_full_position numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN query
WITH
  portfolios_currency AS (
    SELECT
      "bAccounts".idportfolio,
      "bAccounts"."currencyCode"
    FROM
      "bAccounts"
    WHERE
      "bAccounts".idportfolio = ANY (p_idportfolios)
      AND "accountTypeExt" = 8
  ),
  costs_dataset AS (
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
          (
            dtrades_allocated_fifo.qty - dtrades_allocated_fifo.qty_out
          ) * dtrades_allocated_fifo.tr_type AS rest,
          (
            dtrades_allocated_fifo.qty - dtrades_allocated_fifo.qty_out
          ) * dtrades_allocated_fifo.tr_type * dtrades_allocated_fifo.price_in AS cost_in,
          ABS(
            dtrades_allocated_fifo.qty * dtrades_allocated_fifo.tr_type * dtrades_allocated_fifo.price_in
          ) AS cost_fulll
        FROM
          public.dtrades_allocated_fifo
        WHERE
          dtrades_allocated_fifo.out_date <= p_report_date
          AND id_buy_trade = 0
          AND dtrades_allocated_fifo.idportfolio = ANY (p_idportfolios)
        ORDER BY
          idtrade,
          dtrades_allocated_fifo.trade_date,
          qty - qty_out
      ) AS positions
    GROUP BY
      positions.idportfolio,
      positions.secid
  )
SELECT
  crossrates_dataset.cross_rate,
  crossrates_dataset.rate_date,
  costs_dataset.idportfolio,
  costs_dataset.secid,
  costs_dataset.POSITION,
  ROUND(
    costs_dataset.cost_in_position * crossrates_dataset.cross_rate,
    2
  ) AS cost_in_position,
  ROUND(
    costs_dataset.cost_full_position * crossrates_dataset.cross_rate,
    2
  ) AS cost_full_position
FROM
  costs_dataset
  LEFT JOIN portfolios_currency ON portfolios_currency.idportfolio = costs_dataset.idportfolio
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
      AND f_i_get_cross_ratesfor_period_currencylist.quote_code = p_report_currency
    ORDER BY
      f_i_get_cross_ratesfor_period_currencylist.rate_date DESC
    LIMIT
      1
  ) AS crossrates_dataset ON TRUE;
END
$BODY$;

ALTER FUNCTION public.v2f_fifo_get_cost_current_positions(date, bigint[], numeric)
    OWNER TO postgres;
SELECT * FROM v2f_fifo_get_cost_current_positions('11/14/23',	array[11],826);
