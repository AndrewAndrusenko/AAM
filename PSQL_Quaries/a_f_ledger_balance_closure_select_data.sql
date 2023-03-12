-- FUNCTION: public.f_bbalancesheet(date)

DROP FUNCTION IF EXISTS public.f_ledger_balance_closure_select_data(date);

CREATE OR REPLACE FUNCTION public.f_ledger_balance_closure_select_data(
	dateb date)
    RETURNS TABLE
	("ledgerNoId" integer, "dateAcc" date, 
	 "openingBalance" money, "totalCredit" money, "totalDebit" money, "closingBalance" money, code int) 
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000
-- P(C):2+2, P(D):2+1, A(D):1+1, A(C):1+2
AS $BODY$
SELECT 
"bAccountTransaction"."ledgerNoId", "dataTime"::date, "IncomingBalances"."closingBalance" AS "openingBalance",
coalesce(CAST(SUM("amountTransaction") FILTER (WHERE "XactTypeCode" = 2) AS MONEY),'$0') AS "totalCredit",
coalesce(CAST(SUM("amountTransaction") FILTER (WHERE "XactTypeCode" = 1) AS MONEY),'$0') AS "totalDebit",
CAST(SUM (
	CASE ("bAccountTransaction"."XactTypeCode" + "bcAccountType_Ext"."xActTypeCode")
		WHEN 3 THEN "amountTransaction" * -1
		ELSE "amountTransaction"
	END 
) + "IncomingBalances"."closingBalance" AS MONEY)  AS "closingBalance", "bcAccountType_Ext"."xActTypeCode"
FROM public."bAccountTransaction" 
LEFT JOIN "bLedger"
ON "bLedger"."ledgerNoId" = "bAccountTransaction"."ledgerNoId"
LEFT JOIN "bcAccountType_Ext" ON "bLedger"."accountTypeID" = "bcAccountType_Ext"."accountType_Ext"
LEFT JOIN (
	SELECT DISTINCT ON ("bLedgerStatement"."ledgerID") 
	"bLedgerStatement"."ledgerID", "bLedgerStatement"."dateAcc"::date, "bLedgerStatement"."closingBalance",
	"bLedgerStatement"."totalCredit", "bLedgerStatement"."totalDebit"
	 FROM "bLedgerStatement" 
	 WHERE "bLedgerStatement"."dateAcc" < $1 ORDER BY "bLedgerStatement"."ledgerID","dateAcc"::date DESC ) AS "IncomingBalances"
ON ("bAccountTransaction"."ledgerNoId" = "IncomingBalances"."ledgerID")
WHERE "bAccountTransaction"."dataTime"::date = $1::date
GROUP BY "bAccountTransaction"."ledgerNoId", "dataTime"::date, "IncomingBalances"."closingBalance", "bcAccountType_Ext"."xActTypeCode";

$BODY$;

ALTER FUNCTION public.f_ledger_balance_closure_select_data(date)
    OWNER TO postgres;
