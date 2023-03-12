-- FUNCTION: public.f_bbalancesheet(date)

DROP FUNCTION IF EXISTS public.f_basic_balance_sheet_witout_parameters;

CREATE OR REPLACE FUNCTION public.f_basic_balance_sheet_witout_parameters()
    RETURNS TABLE
	("accountId" int, "dateAccounting" date, "accountNo" text,  "accountType" int,  closingBalance money)
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$

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

UNION

SELECT DISTINCT  "bLedger"."ledgerNoId",  "statementsAcconts"."dateAcc", "bLedger"."ledgerNo","bcAccountType_Ext"."xActTypeCode", "closingBalance" 
FROM "bLedger"
LEFT JOIN "bcAccountType_Ext" ON "bLedger"."accountTypeID" = "bcAccountType_Ext"."accountType_Ext"
CROSS JOIN (SELECT DISTINCT "bLedgerStatement"."dateAcc" FROM "bLedgerStatement") AS "statementsAcconts"
LEFT JOIN LATERAL (
	SELECT DISTINCT ON ("bLedgerStatement"."ledgerID") 
	"bLedgerStatement"."ledgerID", "bLedgerStatement"."dateAcc", "bLedgerStatement"."closingBalance"
	FROM "bLedgerStatement" 
	WHERE "bLedgerStatement"."dateAcc" <= "statementsAcconts"."dateAcc" 
	ORDER BY "bLedgerStatement"."ledgerID","dateAcc" DESC ) AS "Balances"
 ON "bLedger"."ledgerNoId" = "Balances"."ledgerID"
ORDER BY "dateAcc", "accountNo"

$BODY$;

ALTER FUNCTION public.f_basic_balance_sheet_witout_parameters()
    OWNER TO postgres;
