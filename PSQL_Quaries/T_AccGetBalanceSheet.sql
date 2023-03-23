SELECT 
"accountNo",  "bAccounts"."accountId", 'Account' as "accountType",
COALESCE ("IncomingBalances"."dateAcc", "bAccountStatement"."dateAcc") AS "datePreviousBalance",
"bAccountStatement"."dateAcc" AS "dateBalance",
CAST(coalesce("IncomingBalances"."closingBalance" , 0) AS money) AS "openingBalance" , 
CAST( "bAccountStatement"."totalCredit" AS money), 
CAST( "bAccountStatement"."totalDebit" AS money), 
CAST("bAccountStatement"."closingBalance" AS money),
(coalesce("IncomingBalances"."closingBalance",0) - "bAccountStatement"."closingBalance") +
CASE "bcAccountType_Ext"."xActTypeCode"
when 1 THEN ("bAccountStatement"."totalDebit" - "bAccountStatement"."totalCredit")
when 2 THEN ("bAccountStatement"."totalDebit" - "bAccountStatement"."totalCredit")*-1
END 
as "checkClosing"
FROM public."bAccounts"
LEFT JOIN "bcAccountType_Ext" ON "bAccounts"."accountTypeExt" = "bcAccountType_Ext"."accountType_Ext"
LEFT JOIN "bAccountStatement" ON ("bAccounts"."accountId" = "bAccountStatement"."accountId" )
LEFT JOIN LATERAL 
  (SELECT DISTINCT ON("b"."accountId") 
	"b"."accountId", "b"."dateAcc", "b"."closingBalance",
	"b"."totalCredit", "b"."totalDebit" 
	FROM "bAccountStatement" as "b" 
    WHERE "b"."dateAcc" < "bAccountStatement"."dateAcc" 
	ORDER BY "b"."accountId", "dateAcc" DESC 
  ) AS "IncomingBalances"
ON "bAccounts"."accountId" = "IncomingBalances"."accountId"
WHERE "bAccountStatement"."dateAcc" IS NOT NULL
UNION
SELECT 
"ledgerNo",  "ledgerNoId", 'Ledger' as "accountType",
COALESCE ("IncomingBalances"."dateAcc", "bLedgerStatement"."dateAcc"), 
"bLedgerStatement"."dateAcc",
CAST(coalesce("IncomingBalances"."closingBalance" , 0) AS money) AS "openingBalance" , 
CAST( "bLedgerStatement"."totalCredit" AS money), 
CAST( "bLedgerStatement"."totalDebit" AS money), 
CAST("bLedgerStatement"."closingBalance" AS money),
(coalesce("IncomingBalances"."closingBalance",0) - "bLedgerStatement"."closingBalance") +
CASE "bcAccountType_Ext"."xActTypeCode"
when 1 THEN ("bLedgerStatement"."totalDebit" - "bLedgerStatement"."totalCredit")
when 2 THEN ("bLedgerStatement"."totalDebit" - "bLedgerStatement"."totalCredit")*-1
END 
as "checkClosing"
FROM public."bLedger"
LEFT JOIN "bLedgerStatement" ON ("bLedger"."ledgerNoId" = "bLedgerStatement"."ledgerID" )
LEFT JOIN "bcAccountType_Ext" ON "bLedger"."accountTypeID" = "bcAccountType_Ext"."accountType_Ext"
LEFT JOIN LATERAL 
  (SELECT DISTINCT ON("b"."ledgerID") 
	"b"."ledgerID", "b"."dateAcc", "b"."closingBalance",
	"b"."totalCredit", "b"."totalDebit" 
	FROM "bLedgerStatement" as "b" 
    WHERE "b"."dateAcc" < "bLedgerStatement"."dateAcc" 
	ORDER BY "b"."ledgerID", "dateAcc" DESC 
  ) AS "IncomingBalances"
ON "bLedger"."ledgerNoId" = "IncomingBalances"."ledgerID"
WHERE "bLedgerStatement"."dateAcc" IS NOT NULL AND
  ( "ledgerNo" = ANY(ARRAY['47416840CHASU0001', '30114840CHASU0001'] ))
ORDER BY "accountNo", 5 DESC