-- FUNCTION: public.f_i_get_market_quotes_for_portfolios(text[], date)

DROP FUNCTION IF EXISTS public.v2f_i_get_npv_dynamic_with_perfomance_twroi(text[], date,date,numeric);

CREATE OR REPLACE FUNCTION public.v2f_i_get_npv_dynamic_with_perfomance_twroi(
	p_portfolios_list text[],
	p_report_date_start date,
	p_report_date_end date,
	p_report_currency numeric)
    RETURNS TABLE(
		portfolioname char varying,
		report_date date,
		npv money,
		roi_current_period numeric,
		time_wighted_roi numeric,
		last_npv money,
		cash_flow money,
		correction_rate numeric,
		correction_rate_compound numeric,
		period_start_date date)    
	LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000
AS $BODY$
DECLARE 
BEGIN
RETURN query
WITH
  npv_dynamic AS (
    SELECT * FROM
      f_i_get_npv_dynamic (p_portfolios_list, p_report_date_start, p_report_date_end, p_report_currency)
    WHERE
      f_i_get_npv_dynamic."accountNo" ISNULL
  ),
  cash_transactions AS (
    SELECT
      dportfolios.portfolioname,
	  "dataTime",
      min ("dataTime")::date as date_first_transaction,
      max ("dataTime")::date as date_last_transaction,
      "accountNo",
      SUM(CASE
        WHEN "XactTypeCode_Ext" = 5 THEN "amountTransaction" * -1
        ELSE "amountTransaction"
      END) AS cash_flow
    FROM
      "bAccountTransaction"
      LEFT JOIN "bAccounts" ON "bAccounts"."accountId" = "bAccountTransaction"."accountId"
      LEFT JOIN dportfolios ON "bAccounts".idportfolio = dportfolios.idportfolio
    WHERE
      dportfolios.portfolioname = ANY (p_portfolios_list)
      AND "XactTypeCode_Ext" = ANY (ARRAY[3, 5])
	GROUP BY 
	grouping sets ((dportfolios.portfolioname, "dataTime", "accountNo"),())
  ),
  corrections_to_roi AS (
	  SELECT
	  (cash_transactions_main."dataTime" - '1 day'::INTERVAL)::date AS correction_date,
      cash_transactions_main.cash_flow,
      cash_transactions_main.portfolioname,
	  COALESCE(npv_dynamic.pos_pv,0) AS last_npv,
	  (COALESCE(npv_dynamic.pos_pv, 0) + cash_transactions_main.cash_flow) AS funds_invested
    FROM  cash_transactions AS cash_transactions_main
      LEFT JOIN LATERAL (
		  SELECT * from f_i_get_npv_dynamic (
			  p_portfolios_list, 
			  (select date_first_transaction from cash_transactions where cash_transactions."portfolioname" isnull ),
			  (select date_last_transaction from cash_transactions where cash_transactions."portfolioname" isnull ),
			  840)
		  where "accountNo" isnull and
		 f_i_get_npv_dynamic.report_date = cash_transactions_main."dataTime" - '1 day'::INTERVAL
        AND cash_transactions_main.portfolioname = f_i_get_npv_dynamic.portfolioname
      ) as npv_dynamic ON TRUE
      LEFT JOIN LATERAL (
        SELECT * FROM 
          cash_transactions
        WHERE  
		  cash_transactions."dataTime" <= cash_transactions_main."dataTime" - '1 day'::INTERVAL
          AND cash_transactions_main.portfolioname = cash_transactions.portfolioname
        ORDER BY
          cash_transactions."dataTime" DESC
        LIMIT 1
      ) AS cash_transactions1 ON TRUE
	WHERE  cash_transactions_main."portfolioname" notnull
  ),
  correction_rates_set AS (
    SELECT
      ctr_joined.funds_invested AS base_to_correct,
      ROUND(ctr_main.last_npv / ctr_joined.funds_invested, 4) AS correction_rate,
      ctr_main.cash_flow,
      ctr_main.last_npv,
      ctr_main.correction_date,
      ctr_main.portfolioname
    FROM
      corrections_to_roi AS ctr_main
      LEFT JOIN LATERAL (
        SELECT * FROM
          corrections_to_roi
        WHERE
          corrections_to_roi.correction_date < ctr_main.correction_date
          AND corrections_to_roi.portfolioname = ctr_main.portfolioname
        ORDER BY
          correction_date DESC
        LIMIT 1
      ) AS ctr_joined ON TRUE
  ),
  correction_rate_array AS (
    SELECT
      (correction_date + '1 day'::INTERVAL)::date AS period_start_date,
      ROUND(
        f_com_reduce_array_mult (
          ARRAY_AGG(COALESCE(correction_rates_set.correction_rate, 1)) OVER (
            ORDER BY
              correction_rates_set.portfolioname,
              correction_rates_set."correction_date" ASC ROWS BETWEEN UNBOUNDED PRECEDING
              AND CURRENT ROW
          )
        ),
        4
      ) AS correction_rate_compound,
      correction_rates_set.*
    FROM
      correction_rates_set
  )
SELECT
  npv_dynamic.portfolioname,
  npv_dynamic.report_date,
  npv_dynamic.pos_pv::money AS npv,
  ROUND((npv_dynamic.pos_pv / (cra.last_npv + cra.cash_flow) -1) * 100, 3) AS roi_current_period,
  ROUND(npv_dynamic.pos_pv / (cra.last_npv + cra.cash_flow) * 100 * cra.correction_rate_compound-100,3) AS time_wighted_roi,
  cra.last_npv::money,
  cra.cash_flow::money,
  cra.correction_rate,
  cra.correction_rate_compound,
  cra.period_start_date
FROM
  npv_dynamic
  LEFT JOIN LATERAL (
    SELECT * FROM
      correction_rate_array
    WHERE
      correction_rate_array.period_start_date <= npv_dynamic.report_date
      AND npv_dynamic.portfolioname = correction_rate_array.portfolioname
    ORDER BY
      correction_rate_array.period_start_date DESC
    LIMIT 1
  ) AS cra ON TRUE
ORDER BY
  report_date DESC;
END;
$BODY$;

ALTER FUNCTION public.v2f_i_get_npv_dynamic_with_perfomance_twroi (text[], date,date,numeric)
    OWNER TO postgres;
select 
*
from v2f_i_get_npv_dynamic_with_perfomance_twroi( Array['ACM002','VPC004'],'11/01/2023','11/28/2023',840)
 