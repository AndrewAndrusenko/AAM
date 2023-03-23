-- FUNCTION: public.f_bbalancesheet_lastmovement(date)

DROP FUNCTION IF EXISTS public.f_bbalancesheet_lastmovement(date);

CREATE OR REPLACE FUNCTION public.f_bbalancesheet_lastmovement_full(
	)
    RETURNS TABLE("accountNo" text, "accountId" integer, "accountType" text, "dataTime" date, "openingBalance" money, "totalCredit" money, "totalDebit" money, "closingBalance" money, "lastMovement" date) 
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$


SELECT 
"accountNo",  "bAccounts"."accountId", 'Account' as "accountType",
"bAccountStatement"."dateAcc", 
coalesce("IncomingBalances1"."closingBalance" , 0) AS "openingBalance", 
coalesce("bAccountStatement"."totalCredit", "IncomingBalances1"."totalCredit") , 
coalesce("bAccountStatement"."totalDebit", "IncomingBalances1"."totalDebit") ,
coalesce("bAccountStatement"."closingBalance", "IncomingBalances1"."closingBalance"), 
coalesce("bAccountStatement"."dateAcc", "IncomingBalances1"."dateAcc")  AS "lastMovement"
-- "bAccountStatement"."dateAcc" AS "lastMovement"

  FROM public."bAccounts"
  LEFT JOIN "bAccountStatement" ON ("bAccounts"."accountId" = "bAccountStatement"."accountId" )
  LEFT JOIN LATERAL (
	SELECT 
	"IncomingBalances"."accountId", "bAccountStatement"."dateAcc", "bAccountStatement"."closingBalance",
	"bAccountStatement"."totalCredit", "bAccountStatement"."totalDebit"
	FROM "bAccountStatement" AS "IncomingBalances"
	WHERE "IncomingBalances"."dateAcc" < "bAccountStatement"."dateAcc" - '1 day'::interval AND "IncomingBalances"."accountId" = "bAccountStatement"."accountId"
	ORDER BY "IncomingBalances"."accountId","IncomingBalances"."dateAcc"::date DESC  LIMIT 1) AS "IncomingBalances1"
  ON ("bAccounts"."accountId" = "IncomingBalances1"."accountId")
ORDER BY "accountType", "bAccountStatement"."dateAcc" desc
$BODY$;

ALTER FUNCTION public.f_bbalancesheet_lastmovement_full()
    OWNER TO postgres;
