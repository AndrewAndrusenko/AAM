SELECT DISTINCT  "bAccounts"."accountId",  "statementsAcconts"."dateAcc", "bAccounts"."accountNo","bcAccountType_Ext"."xActTypeCode", "closingBalance" 
FROM "bAccounts"
LEFT JOIN "bcAccountType_Ext" ON "bAccounts"."accountTypeExt" = "bcAccountType_Ext"."accountType_Ext"
CROSS JOIN (SELECT DISTINCT "bAccountStatement"."dateAcc" FROM "bAccountStatement") AS "statementsAcconts"
LEFT JOIN LATERAL (
	SELECT DISTINCT ON ("bAccountStatement"."accountId") 
	"bAccountStatement"."accountId", "bAccountStatement"."dateAcc", "bAccountStatement"."closingBalance"
	FROM "bAccountStatement" 
	WHERE "bAccountStatement"."dateAcc" <= "statementsAcconts"."dateAcc" 
	ORDER BY "bAccountStatement"."accountId","dateAcc" DESC ) AS "Balances"
 ON "bAccounts"."accountId" = "Balances"."accountId"
ORDER BY "dateAcc", "accountId",   "bAccounts"."accountNo"