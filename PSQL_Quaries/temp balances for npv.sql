WITH dates_with_accounts AS (
	select distinct "accountNo",cash_movements_dates."dataTime",secid
	from temp_balance 
	FULL JOIN (
		select "dataTime" from "bAccountTransaction" where "accountId"=13 AND "XactTypeCode_Ext" = ANY(ARRAY[3,4,5])
	) AS cash_movements_dates ON TRUE
	where portfolioname='ACM002'
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
SELECT "dataTime" AS report_date,"accountNo",balances_per_dates.secid,
"OutGoingBalance" AS balance,
SUM(COALESCE(close,1)*"OutGoingBalance") AS pos_pv,
close as mtm, tradedate as mtm_date 
FROM balances_per_dates
 LEFT   JOIN LATERAL (
   SELECT tradedate,close,secid
   FROM   t_moexdata_foreignshares
   WHERE  
		secid = balances_per_dates.secid
		AND    tradedate   < balances_per_dates."dataTime"
		AND close notnull
   ORDER  BY tradedate DESC
   LIMIT  1
   ) t2 ON TRUE
GROUP BY
GROUPING SETS (("dataTime","accountNo",balances_per_dates.secid,"OutGoingBalance",close, tradedate),("dataTime"))
ORDER BY balances_per_dates."dataTime" desc