SELECT	COALESCE(
	SUM 
		(CASE ("bAccountTransaction"."XactTypeCode" + "bcAccountType_Ext"."xActTypeCode")
			WHEN 3 THEN "amountTransaction"
			ELSE         "amountTransaction"*-1
		END)  
	FILTER (WHERE 
		"id" !=10297 AND 
		"bAccountTransaction"."dataTime"::date <= 'Wed Mar 15 2023' AND 
		"bAccountTransaction"."dataTime"::date > "IncomingBalances"."dateAcc"::date)
,0) 
+ 
CASE ( 1 + "bcAccountType_Ext"."xActTypeCode")
	WHEN 3 THEN 300
	ELSE -300
END  AS "closingBalance"
FROM (
	
	SELECT DISTINCT ON ("bAccountStatement"."accountId") 
	"bAccountStatement"."accountId", "bAccountStatement"."dateAcc"::date, "bAccountStatement"."closingBalance",
	"bAccountStatement"."totalCredit", "bAccountStatement"."totalDebit"
	 FROM "bAccountStatement" 
	 WHERE "bAccountStatement"."dateAcc"::date < 'Wed Mar 15 2023' ORDER BY "bAccountStatement"."accountId","dateAcc"::date DESC) AS "IncomingBalances"
	 LEFT JOIN "bAccounts"
ON ("bAccounts"."accountId" = "IncomingBalances"."accountId")

LEFT JOIN "bcAccountType_Ext" 
ON "bAccounts"."accountTypeExt" = "bcAccountType_Ext"."accountType_Ext"

LEFT JOIN public."bAccountTransaction"
ON "bAccounts"."accountId" = "bAccountTransaction"."accountId"
GROUP BY "bcAccountType_Ext"."xActTypeCode" ,"bAccountTransaction"."accountId", "IncomingBalances"."closingBalance";
