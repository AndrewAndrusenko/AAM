-- FUNCTION: public.f_bbalancesheet(date)

DROP FUNCTION IF EXISTS public.f_bbalancesheet(date);

CREATE OR REPLACE FUNCTION public.f_bbalancesheet(
	dateb date)
    RETURNS TABLE("accountNo" text,"accountId" integer, "dataTime" date, "Incoming" money, "totalCredit" money, "totalDebit" money, "OutGoingBalance" money) 
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
SELECT 
"ledgerNo",  "ledgerNoId", "dateAcc", 
coalesce("IncomingBalances"."closingBalance" , 0) AS "Incoming" , 
coalesce("bLedgerStatement"."totalCredit",0), 
coalesce("bLedgerStatement"."totalDebit",0), 
coalesce("bLedgerStatement"."closingBalance",0)
	FROM public."bLedger"
	LEFT JOIN "bLedgerStatement" ON ("bLedger"."ledgerNoId" = "bLedgerStatement"."ledgerID" AND "bLedgerStatement"."dateAcc" = $1)
	LEFT JOIN (SELECT "bLedgerStatement"."ledgerID",  "bLedgerStatement"."closingBalance" 
		  FROM "bLedgerStatement" WHERE "bLedgerStatement"."dateAcc" < $1 ORDER BY "dateAcc" LIMIT 1 ) AS "IncomingBalances"
		  ON "bLedger"."ledgerNoId" = "IncomingBalances"."ledgerID"
UNION
SELECT 
"accountNo",  "bAccounts"."accountId", "dateAcc", 
coalesce("IncomingBalances"."closingBalance" , 0) AS "Incoming", 
coalesce("bAccountStatement"."totalCredit", 0) , 
coalesce("bAccountStatement"."totalDebit", 0) ,
coalesce("bAccountStatement"."closingBalance", 0) 
	FROM public."bAccounts"
	LEFT JOIN "bAccountStatement" ON ("bAccounts"."accountId" = "bAccountStatement"."accountId" AND "bAccountStatement"."dateAcc" = $1)
	LEFT JOIN (SELECT "bAccountStatement"."accountId",  "bAccountStatement"."closingBalance" 
		  FROM "bAccountStatement" WHERE "bAccountStatement"."dateAcc" < $1 ORDER BY "dateAcc" LIMIT 1 ) AS "IncomingBalances"
		  ON ("bAccounts"."accountId" = "IncomingBalances"."accountId" AND "bAccountStatement"."dateAcc" = $1)
$BODY$;

ALTER FUNCTION public.f_bbalancesheet(date)
    OWNER TO postgres;
