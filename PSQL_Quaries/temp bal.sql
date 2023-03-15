-- FUNCTION: public.f_bbalancesheet(date)

DROP FUNCTION IF EXISTS public.tf_checkoverdraftbyaccountandbydate(date, numeric,numeric, numeric);

CREATE OR REPLACE FUNCTION public.tf_checkoverdraftbyaccountandbydate(
	dateTransation date, accountId numeric , transactionxActTypeCode numeric, amountTransaction numeric)
    RETURNS TABLE
	("accountCode" numeric, "accountId" numeric, "openingBalance" money, "totalCredit" money, "totalDebit" money, "closingBalance" money) 
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000
-- P(C):2+1, P(D):2+2, A(D):1+2, A(C):1+1
AS $BODY$
SELECT 
"bcAccountType_Ext"."xActTypeCode" AS "accountCode",
"bAccountTransaction"."accountId" + $3, "IncomingBalances"."closingBalance" AS "openingBalance",
coalesce(CAST(SUM("amountTransaction") FILTER (WHERE "XactTypeCode" = 1) AS MONEY),'$0') AS "totalCredit",
coalesce(CAST(SUM("amountTransaction") FILTER (WHERE "XactTypeCode" = 2) AS MONEY),'$0') AS "totalDebit",
CAST(SUM (
	CASE ("bAccountTransaction"."XactTypeCode" + "bcAccountType_Ext"."xActTypeCode")
		WHEN 3 THEN "amountTransaction"
		ELSE "amountTransaction"*-1
	END )

+	"IncomingBalances"."closingBalance" AS numeric)
	 +(CASE ( $3)
	WHEN 3 THEN $4
	ELSE $4*-1
END )
	 AS "closingBalance"
FROM public."bAccountTransaction" 
LEFT JOIN "bAccounts"
ON "bAccounts"."accountId" = "bAccountTransaction"."accountId"
LEFT JOIN "bcAccountType_Ext" ON "bAccounts"."accountTypeExt" = "bcAccountType_Ext"."xActTypeCode"
LEFT JOIN (
	SELECT DISTINCT ON ("bAccountStatement"."accountId") 
	"bAccountStatement"."accountId", "bAccountStatement"."dateAcc"::date, "bAccountStatement"."closingBalance",
	"bAccountStatement"."totalCredit", "bAccountStatement"."totalDebit"
	 FROM "bAccountStatement" 
	 WHERE "bAccountStatement"."dateAcc" < $1 ORDER BY "bAccountStatement"."accountId","dateAcc"::date DESC ) AS "IncomingBalances"
ON ("bAccountTransaction"."accountId" = "IncomingBalances"."accountId")
WHERE  ("bAccountTransaction"."dataTime"::date <= $1::date 
	   AND "bAccountTransaction"."dataTime"::date > "IncomingBalances"."dateAcc"::date
	   AND "bAccountTransaction"."accountId" = $2)
GROUP BY "bAccountTransaction"."accountId", "IncomingBalances"."closingBalance","bcAccountType_Ext"."xActTypeCode";


$BODY$;

ALTER FUNCTION public.tf_checkoverdraftbyaccountandbydate(date, numeric, numeric, numeric)
    OWNER TO postgres;
