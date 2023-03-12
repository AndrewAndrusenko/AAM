-- FUNCTION: public.f_bbalancesheet(date)

DROP FUNCTION IF EXISTS public.f_bbalancesheet(date);

CREATE OR REPLACE FUNCTION public.f_bbalancesheet(
	dateb date)
    RETURNS TABLE
	("accountNo" text,"accountId" integer, "accountType" text ,"dataTime" date, 
	 "openingBalance" money, "totalCredit" money, "totalDebit" money, "OutGoingBalance" money, "lastMovement" date) 
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
SELECT 
"ledgerNo",  "ledgerNoId", 'Ledger' as "accountType",
coalesce("bLedgerStatement"."dateAcc", $1),
coalesce("IncomingBalances"."closingBalance" , 0) AS "openingBalance" , 
coalesce("bLedgerStatement"."totalCredit", 0), 
coalesce("bLedgerStatement"."totalDebit", 0), 
coalesce("bLedgerStatement"."closingBalance", 0),
coalesce("bLedgerStatement"."dateAcc", "IncomingBalances"."dateAcc") AS "lastMovement"
	FROM public."bLedger"
	LEFT JOIN "bLedgerStatement" ON ("bLedger"."ledgerNoId" = "bLedgerStatement"."ledgerID" AND "bLedgerStatement"."dateAcc" = $1)
	LEFT JOIN (SELECT DISTINCT ON("bLedgerStatement"."ledgerID") "bLedgerStatement"."ledgerID", "bLedgerStatement"."dateAcc", "bLedgerStatement"."closingBalance" 
		  FROM "bLedgerStatement" WHERE "bLedgerStatement"."dateAcc" < $1 ORDER BY "bLedgerStatement"."ledgerID", "dateAcc" DESC ) AS "IncomingBalances"
		  ON "bLedger"."ledgerNoId" = "IncomingBalances"."ledgerID"
UNION
SELECT 
"accountNo",  "bAccounts"."accountId", 'Account' as "accountType",
coalesce("bAccountStatement"."dateAcc", $1), 
coalesce("IncomingBalances"."closingBalance" , 0) AS "openingBalance", 
coalesce("bAccountStatement"."totalCredit", 0) , 
coalesce("bAccountStatement"."totalDebit", 0) ,
coalesce("bAccountStatement"."closingBalance", 0), 
coalesce("bAccountStatement"."dateAcc", "IncomingBalances"."dateAcc")  AS "lastMovement"
-- "bAccountStatement"."dateAcc" AS "lastMovement"

	FROM public."bAccounts"
	LEFT JOIN "bAccountStatement" ON ("bAccounts"."accountId" = "bAccountStatement"."accountId" AND "bAccountStatement"."dateAcc" = $1)
	LEFT JOIN (SELECT DISTINCT ON ("bAccountStatement"."accountId") "bAccountStatement"."accountId", "bAccountStatement"."dateAcc", "bAccountStatement"."closingBalance" 
		  FROM "bAccountStatement" WHERE "bAccountStatement"."dateAcc" < $1 ORDER BY "bAccountStatement"."accountId","dateAcc" DESC ) AS "IncomingBalances"
		  ON ("bAccounts"."accountId" = "IncomingBalances"."accountId"
ORDER BY "accountType", "accountNo"
$BODY$;

ALTER FUNCTION public.f_bbalancesheet(date)
    OWNER TO postgres;
