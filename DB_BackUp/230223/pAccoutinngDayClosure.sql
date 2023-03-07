SELECT 
"bAccounts"."accountNo", 
SUM("amountTransaction") AS "totalCredit", "debit"."totalDebit"
FROM "bAccountTransaction"
	LEFT JOIN "bAccounts" ON "bAccounts"."accountId" = "bAccountTransaction"."accountId"
	INNER JOIN (SELECT "accountNo", SUM("amountTransaction") AS "totalDebit" FROM "bAccountTransaction"
	LEFT JOIN "bAccounts" ON "bAccounts"."accountId" = "bAccountTransaction"."accountId"
	WHERE ("XactTypeCode" = 2) AND ("dataTime"::date = (SELECT "FirstOpenedDate"::date FROM public."bLastClosedAccountingDate"))
	GROUP BY "accountNo","XactTypeCode") as "debit"
	ON "debit"."accountNo" = "bAccounts"."accountNo"
	
	WHERE ("XactTypeCode" = 1) AND ("dataTime"::date = (SELECT "FirstOpenedDate"::date FROM public."bLastClosedAccountingDate"))
	GROUP BY "bAccounts"."accountNo", "debit"."totalDebit"
	