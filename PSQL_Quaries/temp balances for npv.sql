WITH dates_with_accounts AS (
	select distinct "accountNo",cash_movements_dates."dataTime",secid,portfolioname
	from temp_balance 
	FULL JOIN (
SELECT date_trunc('day', dd):: date as "dataTime"
FROM generate_series
        ( '2023-10-01'::timestamp 
        , '2023-11-21'::timestamp
        , '1 day'::interval) dd
        
-- 		select "dataTime" from "bAccountTransaction" where "accountId"=13 AND "XactTypeCode_Ext" = ANY(ARRAY[3,4,5])
	) AS cash_movements_dates ON TRUE
	where portfolioname=ANY(ARRAY['ACM002','ICM011'])
),
balances_per_dates AS (
	SELECT  * FROM dates_with_accounts
	LEFT JOIN LATERAL (
	  SELECT "OutGoingBalance"
		FROM temp_balance
		WHERE temp_balance."accountNo"=dates_with_accounts."accountNo"
		AND temp_balance."dateBalance" <= dates_with_accounts."dataTime"
		ORDER BY temp_balance."dateBalance"  desc
		LIMIT 1) bal2 ON TRUE
)
SELECT "dataTime" AS report_date,portfolioname, "accountNo",balances_per_dates.secid,
"OutGoingBalance" AS balance,
SUM(COALESCE(close,1)*"OutGoingBalance")::money AS pos_pv,
close as mtm, tradedate as mtm_date 
FROM balances_per_dates
 LEFT JOIN LATERAL (
   SELECT tradedate,close,secid
   FROM   t_moexdata_foreignshares
   WHERE  
		secid = balances_per_dates.secid
		AND    tradedate   <= balances_per_dates."dataTime"
		AND close notnull
   ORDER  BY tradedate DESC
   LIMIT  1
   ) t2 ON TRUE
GROUP BY
GROUPING SETS (("dataTime","accountNo",balances_per_dates.secid,"OutGoingBalance",close, tradedate,portfolioname),("dataTime",portfolioname))
-- having "dataTime" ='2023-11-01' and balances_per_dates.secid='TSLA-RM'
HAVING "accountNo" isnull
ORDER BY portfolioname, balances_per_dates."dataTime" desc