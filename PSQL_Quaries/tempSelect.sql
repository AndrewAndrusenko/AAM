SELECT "accountId", "accountNo", "dataTime", "xActTypeCode", "openingBalance"::money, 
COALESCE("corrOpeningBalance",0)::money as "corrOpeningBalance", "closingBalance" ::money as "totalTurnOver",
(COALESCE("corrOpeningBalance",0) + "closingBalance")::money as "closingBal",

"totalCredit", "totalDebit"
	FROM public."tCurrentTurnOvers"
		where "accountId" = 2
	order by "accountId","dataTime"

	