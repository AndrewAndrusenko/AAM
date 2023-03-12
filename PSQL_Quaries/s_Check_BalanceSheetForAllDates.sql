SELECT "dateAccounting",
coalesce(CAST(SUM(closingbalance) FILTER (WHERE "accountType" = 2) AS MONEY),'$0') AS "totalCredit",
coalesce(CAST(SUM(closingbalance) FILTER (WHERE "accountType" = 1) AS MONEY),'$0') AS "totalDebit",
CAST(SUM (
	CASE ("accountType")
		WHEN 1 THEN "closingbalance"
		ELSE "closingbalance"*-1
	END 
)  AS MONEY)  AS "discrepancy"
FROM f_basic_balance_sheet_witout_parameters() 
GROUP BY "dateAccounting"::date
ORDER BY "dateAccounting"