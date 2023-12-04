-- SELECT * FROM f_a_b_balancesheet_total_closed_and_notclosed() 
-- 	WHERE f_a_b_balancesheet_total_closed_and_notclosed.portfolioname = ANY (array(select portfolioname from dportfolios))
delete from temp_balance;
insert into temp_balance 
SELECT * FROM f_a_b_balancesheet_total_closed_and_notclosed() 
	WHERE f_a_b_balancesheet_total_closed_and_notclosed.portfolioname = ANY (array(select portfolioname from dportfolios));

with 
-- temp_balance AS (
-- SELECT * FROM f_a_b_balancesheet_total_closed_and_notclosed() 
-- 	WHERE f_a_b_balancesheet_total_closed_and_notclosed.portfolioname = ANY (array(select portfolioname from dportfolios))
-- )
-- ,  
dates_with_accounts AS (
    SELECT DISTINCT
      temp_balance."accountNo",
      cash_movements_dates."dataTime",
      temp_balance.secid,
      temp_balance.portfolioname,
	  temp_balance.currencycode,
	  temp_balance."dateOpening"
    FROM
      temp_balance
      FULL JOIN (
        SELECT DATE_TRUNC('day', dd)::date AS "dataTime"
        FROM
          GENERATE_SERIES(
			'02/22/23'::TIMESTAMP,
            '11/28/23'::TIMESTAMP,
            '1 day'::INTERVAL
          ) dd
      ) AS cash_movements_dates ON TRUE
	  where
	 cash_movements_dates."dataTime">= temp_balance."dateOpening"
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
SELECT
  "dataTime" AS report_date,
  balances_per_dates.portfolioname,
  balances_per_dates."accountNo",
  balances_per_dates.secid,
 
  close AS mtm,
  tradedate::date AS mtm_date
 
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