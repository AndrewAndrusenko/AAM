-- FUNCTION: public.f_fifo_get_cost_current_positions(date, bigint[], numeric)

DROP FUNCTION IF EXISTS public.f_i_get_pl_dynamic_with_npv(date,date, text[], numeric);

CREATE OR REPLACE FUNCTION public.f_i_get_pl_dynamic_with_npv(
	p_report_date_start date,
	p_report_date_end date,
	p_portfolios_list text[],
	p_report_currency numeric)
    RETURNS TABLE(
	cross_rate numeric,
	rate_date date,
	report_date date, 
	portfolioname character varying,  
	secid character varying, 
	total_pl money,
	mtm_pl money,
	pl money,
	current_fifo_position_cost numeric,
	account_currency_code bigint,
	idportfolio numeric,
	balance numeric, 
	pos_pv numeric, 
	mtm_rate numeric, 
	mtm_date date,  
	dirty_price numeric 
	) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN QUERY
WITH
  portfolios_currency AS (
    SELECT
      "bAccounts".idportfolio,
      "bAccounts"."currencyCode"
    FROM
      "bAccounts"
      LEFT JOIN dportfolios USING (idportfolio)
    WHERE
      dportfolios.portfolioname = ANY (p_portfolios_list)
      AND "accountTypeExt" = 8
  )
SELECT
  crossrates_dataset.cross_rate,
  crossrates_dataset.rate_date,
  f_i_get_npv_dynamic.report_date,
  f_i_get_npv_dynamic.portfolioname,
  f_i_get_npv_dynamic.secid,
  (
    f_i_get_npv_dynamic.pos_pv - ROUND(
      (
        pl_costs_joined.current_fifo_position_cost - COALESCE(pl_costs_joined.profit_loss, 0)
      ) * crossrates_dataset.cross_rate,
      2
    )
  )::money AS total_pl,
  f_i_get_npv_dynamic.pos_pv::money - ROUND(
    pl_costs_joined.current_fifo_position_cost * crossrates_dataset.cross_rate,
    2
  )::money AS mtm_pl,
  ROUND(
    COALESCE(pl_costs_joined.profit_loss, 0) * crossrates_dataset.cross_rate,
    2
  )::money AS pl,
  ROUND(
    pl_costs_joined.current_fifo_position_cost * crossrates_dataset.cross_rate,
    2
  ) AS current_fifo_position_cost,
  pl_costs_joined.currency_code AS account_currency_code,
  pl_costs_joined.idportfolio,
  f_i_get_npv_dynamic.balance,
  f_i_get_npv_dynamic.pos_pv,
  f_i_get_npv_dynamic.mtm_rate,
  f_i_get_npv_dynamic.mtm_date,
  f_i_get_npv_dynamic.dirty_price
FROM
  f_i_get_npv_dynamic (
    p_portfolios_list,
    p_report_date_start,
    p_report_date_end,
    p_report_currency
  )
  LEFT JOIN LATERAL (
    SELECT
      *
    FROM
      f_fifo_get_cost_pl_period_portfoilos_v2 (p_report_date_end, p_portfolios_list)
    WHERE
      f_fifo_get_cost_pl_period_portfoilos_v2.secid = f_i_get_npv_dynamic.secid
      AND f_fifo_get_cost_pl_period_portfoilos_v2.portfolioname = f_i_get_npv_dynamic.portfolioname
      AND f_fifo_get_cost_pl_period_portfoilos_v2.fifo_change_date <= f_i_get_npv_dynamic.report_date
    ORDER BY
      f_fifo_get_cost_pl_period_portfoilos_v2.fifo_change_date DESC
    LIMIT
      1
  ) AS pl_costs_joined ON TRUE
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
        p_report_date_start,
        p_report_date_end,
        p_report_currency
      )
    WHERE
      f_i_get_cross_ratesfor_period_currencylist.base_code = pl_costs_joined.currency_code
      AND f_i_get_cross_ratesfor_period_currencylist.rate_date <= f_i_get_npv_dynamic.report_date
    ORDER BY
      f_i_get_cross_ratesfor_period_currencylist.rate_date DESC
    LIMIT
      1
  ) AS crossrates_dataset ON TRUE
WHERE
  f_i_get_npv_dynamic.secid NOTNULL;
END
$BODY$;

ALTER FUNCTION public.f_i_get_pl_dynamic_with_npv(date, date, text[], numeric)
    OWNER TO postgres;


