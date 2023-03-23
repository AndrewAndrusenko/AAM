SELECT 
"ledgerNo",  "ledgerNoId", 'Ledger' as "accountType",
"IncomingBalances"."dateAcc",
"bLedgerStatement"."dateAcc",
CAST(coalesce("IncomingBalances"."closingBalance" , 0) AS money) AS "openingBalance" , 
CAST("bLedgerStatement"."closingBalance" AS money)
FROM public."bLedger"
LEFT JOIN "bLedgerStatement" ON ("bLedger"."ledgerNoId" = "bLedgerStatement"."ledgerID" )
LEFT JOIN LATERAL 
  (SELECT DISTINCT ON("b"."ledgerID") 
	"b"."ledgerID", "b"."dateAcc", "b"."closingBalance",
	"b"."totalCredit", "b"."totalDebit" 
	FROM "bLedgerStatement" as "b" 
    WHERE "b"."dateAcc" < "bLedgerStatement"."dateAcc" 
	ORDER BY "b"."ledgerID", "dateAcc" DESC 
  ) AS "IncomingBalances"
ON "bLedger"."ledgerNoId" = "IncomingBalances"."ledgerID"
ORDER BY "ledgerNo","bLedgerStatement"."dateAcc" DESC