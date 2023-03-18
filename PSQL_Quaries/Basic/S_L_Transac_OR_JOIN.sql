select 2 AS "ledgerID", CAST(MAX("IncomingBalances"."closingBalance") AS MONEY) AS "openingBalance",
CAST(SUM (CASE ( "bcAccountType_Ext"."xActTypeCode")
	WHEN 1  THEN "amount" *-1
	WHEN 2 THEN "amount" 
END) FILTER (WHERE "bLedgerTransactions"."ledgerID"=2) AS MONEY) AS "CrSignAmount",
CAST(SUM (CASE ("bcAccountType_Ext"."xActTypeCode")
	WHEN 1  THEN "amount" 
	WHEN 2  THEN "amount" *-1 
END) FILTER (WHERE "bLedgerTransactions"."ledgerID_Debit"=2) AS MONEY) AS "DbSignAmount",
MAX("accountTransactionTotals"."sumAccountTransactions") AS "accountTransaction",
MAX("openingBalance" + "CrSignAmount" + "DbSignAmount" + "accountTransaction") AS "closingBalance"

 from "bLedger"
left join "bcAccountType_Ext" on "bcAccountType_Ext"."accountType_Ext" = "bLedger"."accountTypeID"
left join "bLedgerTransactions"	on 
("bLedger"."ledgerNoId" = "bLedgerTransactions"."ledgerID") OR ("bLedger"."ledgerNoId" = "bLedgerTransactions"."ledgerID_Debit")

left join 
(SELECT	"bLedger"."ledgerNoId", CAST(SUM (CASE ("bAccountTransaction"."XactTypeCode" + "bcAccountType_Ext"."xActTypeCode")
			WHEN 3 THEN "amountTransaction" * -1
			ELSE         "amountTransaction" 
		END) as money) 
	  AS "sumAccountTransactions"

FROM "bLedger"
LEFT JOIN "bcAccountType_Ext" ON "bcAccountType_Ext"."accountType_Ext" = "bLedger"."accountTypeID"

LEFT JOIN public."bAccountTransaction"
ON "bLedger"."ledgerNoId" = "bAccountTransaction"."ledgerNoId"
WHERE 
		("bLedger"."ledgerNoId" = 2 AND
		"bAccountTransaction"."dataTime"::date <= '2023-03-19'::date AND 
		"bAccountTransaction"."dataTime"::date > '2023-02-21'::date)
GROUP BY "bLedger"."ledgerNoId"
) AS "accountTransactionTotals"
ON "bLedger"."ledgerNoId" = "accountTransactionTotals"."ledgerNoId"

LEFT JOIN
(SELECT DISTINCT ON ("bLedgerStatement"."ledgerID") 
"bLedgerStatement"."ledgerID", "bLedgerStatement"."dateAcc"::date, "bLedgerStatement"."closingBalance",
"bLedgerStatement"."totalCredit", "bLedgerStatement"."totalDebit"
 FROM "bLedgerStatement" 
 WHERE "bLedgerStatement"."dateAcc"::date < '2023-03-19' ORDER BY "bLedgerStatement"."ledgerID","dateAcc"::date DESC ) 
 AS "IncomingBalances"
ON ("bLedger"."ledgerNoId" = "IncomingBalances"."ledgerID")


where "bLedger"."ledgerNoId" = 2

