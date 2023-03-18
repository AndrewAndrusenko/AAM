-- FUNCTION: public.f_bbalancesheet(date)

DROP FUNCTION IF EXISTS public.f_CheckOverdraftByAccountAndByDate(date, numeric,numeric, numeric);

CREATE OR REPLACE FUNCTION public.f_CheckOverdraftByAccountAndByDate(
	dateTransation date, accountId numeric , transactionxActTypeCode numeric, amountTransaction numeric, idTrasactionModifying: numeric)
    RETURNS TABLE
	("accountId" numeric, "openingBalance" money, "totalCredit" money, "totalDebit" money, "closingBalance" money) 
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000
-- P(C):2+1, P(D):2+2, A(D):1+2, A(C):1+1
AS $BODY$
SELECT 
"bAccountTransaction"."accountId", "IncomingBalances"."closingBalance" AS "openingBalance",
coalesce(CAST(SUM("amountTransaction") FILTER (WHERE "XactTypeCode" = 1) AS MONEY),'$0') AS "totalCredit",
coalesce(CAST(SUM("amountTransaction") FILTER (WHERE "XactTypeCode" = 2) AS MONEY),'$0') AS "totalDebit",
SUM (
	CASE ("bAccountTransaction"."XactTypeCode" + "bcAccountType_Ext"."xActTypeCode")
		WHEN 3 THEN "amountTransaction"
		ELSE "amountTransaction"*-1
	END )

+	"IncomingBalances"."closingBalance" 
	 + (
CASE ( $3 + "bcAccountType_Ext"."xActTypeCode")
	WHEN 3 THEN $4
	ELSE $4*-1
END )
	 AS "closingBalance"
FROM public."bAccountTransaction" 
LEFT JOIN "bAccounts"
ON "bAccounts"."accountId" = "bAccountTransaction"."accountId"
LEFT JOIN "bcAccountType_Ext" ON "bAccounts"."accountTypeExt" = "bcAccountType_Ext"."accountType_Ext"
LEFT JOIN (
	SELECT DISTINCT ON ("bAccountStatement"."accountId") 
	"bAccountStatement"."accountId", "bAccountStatement"."dateAcc"::date, "bAccountStatement"."closingBalance",
	"bAccountStatement"."totalCredit", "bAccountStatement"."totalDebit"
	 FROM "bAccountStatement" 
	 WHERE "bAccountStatement"."dateAcc" < $1 ORDER BY "bAccountStatement"."accountId","dateAcc"::date DESC ) AS "IncomingBalances"
ON ("bAccountTransaction"."accountId" = "IncomingBalances"."accountId")
WHERE  ("bAccountTransaction"."dataTime"::date <= $1::date 
	   AND "bAccountTransaction".id != $5
	   AND "bAccountTransaction"."dataTime"::date > "IncomingBalances"."dateAcc"::date
	   AND "bAccountTransaction"."accountId" = $2)
GROUP BY "bcAccountType_Ext"."xActTypeCode" ,"bAccountTransaction"."accountId", "IncomingBalances"."closingBalance";


$BODY$;

ALTER FUNCTION public.f_CheckOverdraftByAccountAndByDate(date, numeric, int, numeric)
    OWNER TO postgres;
