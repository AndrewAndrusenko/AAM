-- FUNCTION: public.f_i_get_market_quotes_for_portfolios(text[], date)

DROP FUNCTION IF EXISTS public.f_i_get_npv_dynamic_with_performance_data(text[], date,date,numeric);

CREATE OR REPLACE FUNCTION public.f_i_get_npv_dynamic_with_performance_data(
	p_portfolios_list text[],
	p_report_date_start date,
	p_report_date_end date,
	p_report_currency numeric)
    RETURNS TABLE(report_date date,portfolioname character varying, "accountNo" text,secid character varying,
	balance numeric, pos_pv numeric, mtm_rate numeric,  mtm_date date,boardid character varying,percentprice boolean,
	couponrate numeric,nominal_currency char varying,board_currency numeric, cross_rate numeric, accured numeric, dirty_price numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000
AS $BODY$
DECLARE 
first_accounting_date date;
BEGIN
SELECT  "FirstOpenedDate" INTO first_accounting_date FROM public."gAppMainParams";
RETURN query
WITH
temp_balance AS (
SELECT * FROM f_a_b_balancesheet_total_closed_and_notclosed() 
	WHERE f_a_b_balancesheet_total_closed_and_notclosed.portfolioname = ANY (p_portfolios_list)
),
  dates_with_accounts AS (
    SELECT DISTINCT
      temp_balance."accountNo",
      cash_movements_dates."dataTime",
      temp_balance.secid,
      temp_balance.portfolioname,
	  temp_balance.currencycode
    FROM
      temp_balance
      FULL JOIN (
        SELECT DATE_TRUNC('day', dd)::date AS "dataTime"
        FROM
          GENERATE_SERIES(
			p_report_date_start::TIMESTAMP,
            p_report_date_end::TIMESTAMP,
            '1 day'::INTERVAL
          ) dd
      ) AS cash_movements_dates ON TRUE

  ),
  balances_per_dates AS (
    SELECT * FROM dates_with_accounts
      LEFT JOIN LATERAL (
        SELECT "OutGoingBalance" FROM temp_balance
        WHERE
          temp_balance."accountNo" = dates_with_accounts."accountNo"
          AND temp_balance."dateBalance" <= dates_with_accounts."dataTime"
        ORDER BY temp_balance."dateBalance" DESC
        LIMIT 1
      ) bal2 ON TRUE
  ),
  coupon_schedule AS (
  SELECT * FROM f_i_get_accured_interest_for_period_secidlist(
  	ARRAY(SELECT DISTINCT temp_balance.secid FROM temp_balance),
	p_report_date_start,
	p_report_date_end)
  )
SELECT
  "dataTime" AS report_date,
  balances_per_dates.portfolioname,
  balances_per_dates."accountNo",
  balances_per_dates.secid,
  COALESCE("OutGoingBalance",0) AS balance,
  SUM(
	  CASE 
	  WHEN t_moex_boards.percentprice=false THEN
	  COALESCE(close,1) * "OutGoingBalance"*cross_rates.cross_rate 
	  WHEN balances_per_dates.secid isnull
	  THEN "OutGoingBalance"*cross_rates.cross_rate 
	  ELSE 
	  (ROUND(close*unredemeedvalue/100,2) + ROUND(unredemeedvalue*coupon.couponrate/100*( "dataTime" - coupon.start_date)/365,2))
	  * "OutGoingBalance"*cross_rates.cross_rate 
	  END) AS pos_pv,
  close AS mtm,
  tradedate::date AS mtm_date,
  t2.boardid,
  t_moex_boards.percentprice,
  coupon.couponrate,
  coupon.currency as nominal_currency,
  t_moex_boards.currency_code as board_currency,
  cross_rates.cross_rate,
  ROUND(coupon.unredemeedvalue*coupon.couponrate/100*( "dataTime" - coupon.start_date)/365,2) as accured,
  ROUND(close*unredemeedvalue/100,2) + ROUND(unredemeedvalue*coupon.couponrate/100*( "dataTime" - coupon.start_date)/365,2) as dirty_price
FROM
  balances_per_dates
  LEFT JOIN LATERAL (
    SELECT tradedate, close, t_moexdata_foreignshares.secid,t_moexdata_foreignshares.boardid
    FROM t_moexdata_foreignshares
    WHERE
      t_moexdata_foreignshares.secid = balances_per_dates.secid
      AND t_moexdata_foreignshares.tradedate <= balances_per_dates."dataTime"
      AND close NOTNULL
    ORDER BY tradedate DESC
    LIMIT 1
  ) t2 ON TRUE
  LEFT JOIN t_moex_boards ON t_moex_boards.code=t2.boardid
  
  LEFT JOIN LATERAL(
	SELECT * FROM coupon_schedule
	WHERE balances_per_dates."dataTime">coupon_schedule.start_date 
		AND balances_per_dates."dataTime"<=coupon_schedule.end_date 
		AND balances_per_dates.secid = coupon_schedule.secid
  ) AS coupon ON TRUE
  LEFT JOIN LATERAL(
	select * from 
	f_i_get_cross_ratesfor_period_currencylist (array[978,840,826,756,156,810],p_report_date_start,p_report_date_end,p_report_currency)
	WHERE balances_per_dates."dataTime">=f_i_get_cross_ratesfor_period_currencylist.rate_date 
		AND COALESCE(coupon.currency::numeric,t_moex_boards.currency_code,balances_per_dates.currencycode)=f_i_get_cross_ratesfor_period_currencylist.base_code
	ORDER BY rate_date DESC
	  LIMIT 1
  ) AS cross_rates ON TRUE
GROUP BY
  GROUPING SETS (
    ("dataTime",balances_per_dates."accountNo",balances_per_dates.secid,"OutGoingBalance",close, tradedate,balances_per_dates.portfolioname,  
	  t2.boardid,t_moex_boards.percentprice,coupon.couponrate, unredemeedvalue,coupon.start_date,coupon.currency,cross_rates.cross_rate,
	  t_moex_boards.currency_code),
    ("dataTime", balances_per_dates.portfolioname)
  )
ORDER BY
  balances_per_dates.portfolioname,
  balances_per_dates."dataTime" DESC;
END;
$BODY$;

ALTER FUNCTION public.f_i_get_npv_dynamic_with_performance_data(text[], date,date,numeric)
    OWNER TO postgres;
-- select * from f_i_get_npv_dynamic_with_performance_data1( Array(select dportfolios.portfolioname from dportfolios),'10/5/2023','11/1/2023',840)
select 
report_date, pos_pv,portfolioname 
from f_i_get_npv_dynamic_with_performance_data( Array['VPC004','ICM011'],'10/24/2023','11/24/2023',840)

-- where secid='SU29008RMFS8'
-- where nominal_currency='978'
-- where portfolioname='VPC004' 
-- and report_date='11/24/2023'
 where "accountNo" isnull
--  OR 
--   percentprice=true
 