SELECT 
"accountNo", 'Account' as "accountType",
COALESCE ("IncomingBalances"."dateAcc", "bAccountStatement"."dateAcc") AS "datePreviousBalance",
"vbBalanceDateAccounts"."dateAcc" AS "dateBalance",
CAST(coalesce("IncomingBalances"."closingBalance" , 0) AS numeric) AS "openingBalance" ,  
COALESCE ("bAccountStatement"."totalCredit", 0),
COALESCE ( "bAccountStatement"."totalDebit" , 0),
COALESCE ("bAccountStatement"."closingBalance", 0)
FROM public."vbBalanceDateAccounts"
LEFT JOIN "bAccountStatement" 
ON ("vbBalanceDateAccounts"."accountId" = "bAccountStatement"."accountId" AND "bAccountStatement"."dateAcc" = "vbBalanceDateAccounts"."dateAcc" )
LEFT JOIN LATERAL 
  (SELECT DISTINCT ON("b"."accountId") 
	"b"."accountId", "b"."dateAcc", "b"."closingBalance",
	"b"."totalCredit", "b"."totalDebit" 
	FROM "bAccountStatement" as "b" 
    WHERE "b"."dateAcc" < "vbBalanceDateAccounts"."dateAcc" 
	ORDER BY "b"."accountId", "dateAcc" DESC 
  ) AS "IncomingBalances"
ON "vbBalanceDateAccounts"."accountId" = "IncomingBalances"."accountId"
WHERE ( "vbBalanceDateAccounts"."accountId" = 1)