SELECT 
"bAccountTransaction"."accountId","bAccounts"."accountNo", "bAccountTransaction"."dataTime"::date,"bcAccountType_Ext"."xActTypeCode",
"IncomingBalances"."closingBalance" AS "openingBalance", 
	"IncomingBalances"."closingBalance" + (
	select sum(
			CASE ("tr"."XactTypeCode" + "bcAccountType_Ext"."xActTypeCode")
		WHEN 3 THEN "tr"."amountTransaction"
		ELSE "tr"."amountTransaction"*-1
	END
		)  as "sCorr" from "bAccountTransaction" as tr
		where 
	("tr"."accountId" = "bAccountTransaction"."accountId" 
	and "tr"."dataTime"::date < "bAccountTransaction"."dataTime"::date
	and "tr"."dataTime"::date >'2023-02-21')) as "corrOpeningBalance",
CAST(SUM (
	CASE ("bAccountTransaction"."XactTypeCode" + "bcAccountType_Ext"."xActTypeCode")
		WHEN 3 THEN "bAccountTransaction"."amountTransaction"
		ELSE "bAccountTransaction"."amountTransaction"*-1
	END 
) + "IncomingBalances"."closingBalance" AS MONEY)  AS "closingBalance",
coalesce(CAST(SUM("amountTransaction") FILTER (WHERE "XactTypeCode" = 1) AS MONEY),'$0') AS "totalCredit",
coalesce(CAST(SUM("amountTransaction") FILTER (WHERE "XactTypeCode" = 2) AS MONEY),'$0') AS "totalDebit"
-- CAST(SUM (
-- 	CASE ("bAccountTransaction"."XactTypeCode" + "bcAccountType_Ext"."xActTypeCode")
-- 		WHEN 3 THEN "amountTransaction"
-- 		ELSE "amountTransaction"*-1
-- 	END 
-- ) + "IncomingBalances"."closingBalance" AS MONEY)  AS "closingBalance"
FROM public."bAccountTransaction" as "bAccountTransaction"
LEFT JOIN "bAccounts"
ON "bAccounts"."accountId" = "bAccountTransaction"."accountId"
LEFT JOIN "bcAccountType_Ext" ON "bAccounts"."accountTypeExt" = "bcAccountType_Ext"."accountType_Ext"
LEFT JOIN (
	SELECT DISTINCT ON ("bAccountStatement"."accountId") 
	"bAccountStatement"."accountId", "bAccountStatement"."dateAcc"::date, "bAccountStatement"."closingBalance",
	"bAccountStatement"."totalCredit", "bAccountStatement"."totalDebit"
	 FROM "bAccountStatement" 
	 WHERE "bAccountStatement"."dateAcc" <= '2023-02-21'::date  ORDER BY "bAccountStatement"."accountId","dateAcc"::date DESC ) AS "IncomingBalances"
 ON ("bAccountTransaction"."accountId" = "IncomingBalances"."accountId")
WHERE "bAccountTransaction"."dataTime"::date > '2023-02-21'::date AND "bAccountTransaction"."accountId" = 1
GROUP BY "bAccountTransaction"."accountId","accountNo", "bAccountTransaction"."dataTime", "IncomingBalances"."closingBalance", "bcAccountType_Ext"."xActTypeCode"
ORDER BY "dataTime" DESC;

-- SELECT 
-- "accountNo",  "vbBalanceDateAccounts"."accountId", 'Account' as "accountType",
-- COALESCE ("IncomingBalances"."dateAcc", "bAccountStatement"."dateAcc") AS "datePreviousBalance",
-- "vbBalanceDateAccounts"."dateAcc" AS "dateBalance",
-- CAST(coalesce("IncomingBalances"."closingBalance" , 0) AS numeric) AS "openingBalance" ,  
-- COALESCE ("bAccountStatement"."totalCredit", 0),
-- COALESCE ( "bAccountStatement"."totalDebit" , 0),
-- COALESCE ("bAccountStatement"."closingBalance" , 0),
-- (coalesce("IncomingBalances"."closingBalance",0) - "bAccountStatement"."closingBalance") +
-- CASE "bcAccountType_Ext"."xActTypeCode"
-- when 1 THEN ("bAccountStatement"."totalDebit" - "bAccountStatement"."totalCredit")
-- when 2 THEN ("bAccountStatement"."totalDebit" - "bAccountStatement"."totalCredit")*-1
-- END 
-- as "checkClosing"
-- FROM public."vbBalanceDateAccounts"
-- LEFT JOIN "bcAccountType_Ext" ON "vbBalanceDateAccounts"."accountTypeExt" = "bcAccountType_Ext"."accountType_Ext"
-- LEFT JOIN "bAccountStatement" 
-- ON ("vbBalanceDateAccounts"."accountId" = "bAccountStatement"."accountId" AND "vbBalanceDateAccounts"."dateAcc" = "bAccountStatement"."dateAcc" )
-- LEFT JOIN LATERAL 
--   (SELECT DISTINCT ON("b"."accountId") 
-- 	"b"."accountId", "b"."dateAcc", "b"."closingBalance",
-- 	"b"."totalCredit", "b"."totalDebit" 
-- 	FROM "bAccountStatement" as "b" 
--     WHERE "b"."dateAcc" < "vbBalanceDateAccounts"."dateAcc" 
-- 	ORDER BY "b"."accountId", "dateAcc" DESC 
--   ) AS "IncomingBalances"
-- ON "vbBalanceDateAccounts"."accountId" = "IncomingBalances"."accountId"