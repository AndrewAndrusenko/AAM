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
  cash_transactions AS (
    SELECT
      dportfolios.portfolioname,
      "dataTime",
      MIN("dataTime")::date AS date_first_transaction,
      "accountNo",
      SUM(
        CASE
          WHEN "XactTypeCode_Ext" = 5 THEN "amountTransaction" * -1
          ELSE "amountTransaction"
        END
      ) AS cash_flow,
	  "bAccounts"."currencyCode" as account_currency
    FROM
      "bAccountTransaction"
      LEFT JOIN "bAccounts" ON "bAccounts"."accountId" = "bAccountTransaction"."accountId"
      LEFT JOIN dportfolios ON "bAccounts".idportfolio = dportfolios.idportfolio
    WHERE
      dportfolios.portfolioname = ANY (p_portfolios_list)
      AND "XactTypeCode_Ext" = ANY (ARRAY[3, 5])
      AND "dataTime" <= p_report_date_end
    GROUP BY
      GROUPING SETS (
        (
          dportfolios.portfolioname,
          "dataTime",
          "accountNo",
		  "currencyCode"
        ),
        (dportfolios.portfolioname),
        ()
      )
  ),
  npv_dynamic AS (
    SELECT *
    FROM
      f_i_get_npv_dynamic (
        p_portfolios_list,
        CASE
          WHEN (SELECT date_first_transaction FROM cash_transactions WHERE cash_transactions."portfolioname" ISNULL) < p_report_date_start
            THEN (SELECT date_first_transaction FROM cash_transactions WHERE cash_transactions."portfolioname" ISNULL )
          ELSE p_report_date_start
        END,
        p_report_date_end,
        p_report_currency
      )
    WHERE
      f_i_get_npv_dynamic."accountNo" ISNULL AND f_i_get_npv_dynamic.pos_pv notnull AND f_i_get_npv_dynamic.pos_pv!=0
  ),
  cash_transactions_running_total_shift AS (
    SELECT
      ct_main.portfolioname,
      SUM(COALESCE(ct_joined.qty_transactions, 0)) OVER (
        ORDER BY
          ct_main.portfolioname ASC ROWS BETWEEN UNBOUNDED PRECEDING
          AND CURRENT ROW
      ) AS qty_transactions
    FROM
      cash_transactions AS ct_main
      LEFT JOIN LATERAL (
        SELECT
          cash_transactions.portfolioname,
          COUNT(cash_transactions.portfolioname) AS qty_transactions
        FROM
          cash_transactions
        WHERE
          ct_main.portfolioname > cash_transactions.portfolioname
          AND cash_transactions.portfolioname NOTNULL
          AND cash_transactions."accountNo" NOTNULL
        GROUP BY
          cash_transactions.portfolioname
        ORDER BY
          cash_transactions.portfolioname DESC
        LIMIT
          1
      ) AS ct_joined ON TRUE
    WHERE
      ct_main.portfolioname NOTNULL
      AND ct_main."accountNo" ISNULL
  ),
  corrections_to_roi AS (
    SELECT
      (cash_transactions_main."dataTime" - '1 day'::INTERVAL
      )::date AS correction_date,
	  CASE 
		  WHEN cash_transactions_main.account_currency!=p_report_currency 
		  THEN 
		  (select rate from f_i_get_cross_rate_for_trade(cash_transactions_main.account_currency,p_report_currency,cash_transactions_main."dataTime"::date,810::numeric)) 
		  * cash_transactions_main.cash_flow
		  ELSE cash_transactions_main.cash_flow
	  END as cash_flow,
      cash_transactions_main.portfolioname,
      COALESCE(nd1.pos_pv, 0) AS last_npv
    FROM
      cash_transactions AS cash_transactions_main
      LEFT JOIN LATERAL (
        SELECT *
        FROM
          npv_dynamic
        WHERE
          npv_dynamic.report_date = cash_transactions_main."dataTime" - '1 day'::INTERVAL
          AND cash_transactions_main.portfolioname = npv_dynamic.portfolioname
      ) AS nd1 ON TRUE
      LEFT JOIN LATERAL (
        SELECT *
        FROM
          cash_transactions
        WHERE
          cash_transactions."dataTime" <= cash_transactions_main."dataTime" - '1 day'::INTERVAL
          AND cash_transactions_main.portfolioname = cash_transactions.portfolioname
        ORDER BY
          cash_transactions."dataTime" DESC
        LIMIT 1
      ) AS cash_transactions1 ON TRUE
    WHERE
      cash_transactions_main."dataTime" NOTNULL
  ),
  correction_rates_set AS (
    SELECT
      ctr_joined.last_npv+ctr_joined.cash_flow AS base_to_correct,
      ROUND(ctr_main.last_npv / (ctr_joined.last_npv+ctr_joined.cash_flow), 4) AS correction_rate,
      ctr_main.cash_flow,
      ctr_main.last_npv,
      ctr_main.correction_date,
      ctr_main.portfolioname
    FROM
      corrections_to_roi AS ctr_main
      LEFT JOIN LATERAL (
        SELECT *
        FROM
          corrections_to_roi
        WHERE
          corrections_to_roi.correction_date < ctr_main.correction_date
          AND corrections_to_roi.portfolioname = ctr_main.portfolioname
        ORDER BY
          correction_date DESC
        LIMIT 1
      ) AS ctr_joined ON TRUE
  ),
  correction_rate_array_detail AS (
    SELECT
      (correction_date + '1 day'::INTERVAL)::date AS period_start_date,
      ARRAY_AGG(COALESCE(correction_rates_set.correction_rate, 1)) OVER (
        ORDER BY
          correction_rates_set.portfolioname,
          correction_rates_set."correction_date" ASC ROWS BETWEEN UNBOUNDED PRECEDING
          AND CURRENT ROW
      ) AS correction_rate_compound,
      correction_rates_set.*
    FROM
      correction_rates_set
  ),
  correction_rate_array AS (
    SELECT
      correction_rate_array_detail.correction_rate_compound[
        cash_transactions_running_total_shift.qty_transactions + 1:
      ] compond_rate_arr,
      ROUND(
        f_com_reduce_array_mult (
          correction_rate_array_detail.correction_rate_compound[
            cash_transactions_running_total_shift.qty_transactions + 1:
          ]),4
      ) AS correction_compound,
      correction_rate_array_detail.*
    FROM
      correction_rate_array_detail
      LEFT JOIN cash_transactions_running_total_shift ON cash_transactions_running_total_shift.portfolioname = correction_rate_array_detail.portfolioname
  )
SELECT
  npv_dynamic.portfolioname,
  npv_dynamic.report_date,
  npv_dynamic.pos_pv::money AS npv,
  ROUND((npv_dynamic.pos_pv / (cra.last_npv + cra.cash_flow) -1) * 100,3) AS roi_current_period,
  ROUND(npv_dynamic.pos_pv / (cra.last_npv + cra.cash_flow) * 100 * cra.correction_compound -100, 3) AS time_wighted_roi,
  cra.last_npv::money,
  cra.cash_flow::money,
  cra.correction_rate,
  cra.correction_compound,
  cra.period_start_date
FROM
  npv_dynamic
  LEFT JOIN LATERAL (
    SELECT *
    FROM
      correction_rate_array
    WHERE
      correction_rate_array.period_start_date <= npv_dynamic.report_date
      AND npv_dynamic.portfolioname = correction_rate_array.portfolioname
    ORDER BY
      correction_rate_array.period_start_date DESC
    LIMIT 1
  ) AS cra ON TRUE
WHERE 
	npv_dynamic.report_date>=p_report_date_start 
	AND  npv_dynamic.report_date<= p_report_date_end;
END;
$BODY$;

ALTER FUNCTION public.v2f_i_get_npv_dynamic_with_perfomance_twroi (text[], date,date,numeric)
    OWNER TO postgres;
select rates_set.cross_rate,
v2f_i_get_npv_dynamic_with_perfomance_twroi.*
-- from v2f_i_get_npv_dynamic_with_perfomance_twroi( Array['ACM002'],'10/20/2023','11/28/2023',840)
from v2f_i_get_npv_dynamic_with_perfomance_twroi(array(select portfolioname from dportfolios),'05/01/2023','12/04/2023',978)
-- where portfolioname='ICM016'
left join lateral (
	SELECT * from public.f_i_get_cross_ratesfor_period_currencylist(array[978,840,810],'02/20/2023','11/28/2023',810)
	where 
	f_i_get_cross_ratesfor_period_currencylist.rate_date<=v2f_i_get_npv_dynamic_with_perfomance_twroi.report_date
	AND f_i_get_cross_ratesfor_period_currencylist.base_code=978
	order by  rate_date desc
	limit 1
	) as rates_set on true
order by portfolioname, report_date 
 