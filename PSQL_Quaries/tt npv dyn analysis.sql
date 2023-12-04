-- delete from temp_balance;
-- insert into temp_balance 
-- SELECT * FROM f_a_b_balancesheet_total_closed_and_notclosed() 
-- 	WHERE f_a_b_balancesheet_total_closed_and_notclosed.portfolioname = ANY ( array['ACM002','VPC004','CCM004','ICM011']);
WITH
temp_balance AS (
SELECT * FROM 
	f_a_b_balancesheet_total_closed_and_notclosed() 
	WHERE f_a_b_balancesheet_total_closed_and_notclosed.portfolioname = ANY ( array['ACM002','VPC004','CCM004','ICM011'])
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
			'02/23/23'::TIMESTAMP,
            '11/26/23'::TIMESTAMP,
            '1 day'::INTERVAL
          ) dd
      ) AS cash_movements_dates ON TRUE

  )
  ,
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
  )
--   ,
--   coupon_schedule AS (
--   SELECT * FROM f_i_get_accured_interest_for_period_secidlist(
--   	ARRAY(SELECT DISTINCT temp_balance.secid FROM temp_balance),
-- 	'02/23/23',
-- 	'11/26/23')
--   )
  select * from balances_per_dates
  
-- SELECT
--   "dataTime" AS report_date,
--   balances_per_dates.portfolioname,
--   balances_per_dates."accountNo",
--   balances_per_dates.secid,
--   COALESCE("OutGoingBalance",0) AS balance,
--   SUM(
-- 	  CASE 
-- 	  WHEN t_moex_boards.percentprice=false THEN
-- 	  COALESCE(close,1) * "OutGoingBalance"*cross_rates.cross_rate 
-- 	  WHEN balances_per_dates.secid isnull
-- 	  THEN "OutGoingBalance"*cross_rates.cross_rate 
-- 	  ELSE 
-- 	  (ROUND(close*unredemeedvalue/100,2) + ROUND(unredemeedvalue*coupon.couponrate/100*( "dataTime" - coupon.start_date)/365,2))
-- 	  * "OutGoingBalance"*cross_rates.cross_rate 
-- 	  END) AS pos_pv,
--   close AS mtm,
--   tradedate::date AS mtm_date,
--   t2.boardid,
--   t_moex_boards.percentprice,
--   coupon.couponrate,
--   coupon.currency as nominal_currency,
--   t_moex_boards.currency_code as board_currency,
--   cross_rates.cross_rate,
--   ROUND(coupon.unredemeedvalue*coupon.couponrate/100*( "dataTime" - coupon.start_date)/365,2) as accured,
--   ROUND(close*unredemeedvalue/100,2) + ROUND(unredemeedvalue*coupon.couponrate/100*( "dataTime" - coupon.start_date)/365,2) as dirty_price
-- FROM
--   balances_per_dates
--   LEFT JOIN LATERAL (
--     SELECT tradedate, close, t_moexdata_foreignshares.secid,t_moexdata_foreignshares.boardid
--     FROM t_moexdata_foreignshares
--     WHERE
--       t_moexdata_foreignshares.secid = balances_per_dates.secid
--       AND t_moexdata_foreignshares.tradedate <= balances_per_dates."dataTime"
--       AND close NOTNULL
--     ORDER BY tradedate DESC
--     LIMIT 1
--   ) t2 ON TRUE
--   LEFT JOIN t_moex_boards ON t_moex_boards.code=t2.boardid
  
--   LEFT JOIN LATERAL(
-- 	SELECT * FROM coupon_schedule
-- 	WHERE balances_per_dates."dataTime">coupon_schedule.start_date 
-- 		AND balances_per_dates."dataTime"<=coupon_schedule.end_date 
-- 		AND balances_per_dates.secid = coupon_schedule.secid
--   ) AS coupon ON TRUE
--   LEFT JOIN LATERAL(
-- 	select * from 
-- 	f_i_get_cross_ratesfor_period_currencylist (array[978,840,826,756,156,810],'02/23/23','11/26/23',840)
-- 	WHERE balances_per_dates."dataTime">=f_i_get_cross_ratesfor_period_currencylist.rate_date 
-- 		AND COALESCE(coupon.currency::numeric,t_moex_boards.currency_code,balances_per_dates.currencycode)=f_i_get_cross_ratesfor_period_currencylist.base_code
-- 	ORDER BY rate_date DESC
-- 	  LIMIT 1
--   ) AS cross_rates ON TRUE
-- GROUP BY
--   GROUPING SETS (
--     ("dataTime",balances_per_dates."accountNo",balances_per_dates.secid,"OutGoingBalance",close, tradedate,balances_per_dates.portfolioname,  
-- 	  t2.boardid,t_moex_boards.percentprice,coupon.couponrate, unredemeedvalue,coupon.start_date,coupon.currency,cross_rates.cross_rate,
-- 	  t_moex_boards.currency_code),
--     ("dataTime", balances_per_dates.portfolioname)
--   )
-- ORDER BY
--   balances_per_dates.portfolioname,
--   balances_per_dates."dataTime" DESC;
