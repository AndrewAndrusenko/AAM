-- FUNCTION: public.f_getopeingbalancebyledgerid(date, numeric)

DROP FUNCTION IF EXISTS public.f_getopeingbalancebyaccountid (date, numeric);

CREATE OR REPLACE FUNCTION public.f_getopeingbalancebyaccountid(
	dateacc date,
	accountid numeric)
    RETURNS TABLE("accountId" numeric, "accountTypeID" numeric, "dateAcc" date, "closingBalance" numeric) 
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
SELECT $2 AS "accountId", "bAccounts"."accountTypeExt", "IncomingBalances"."dateAcc",  coalesce ( "IncomingBalances"."closingBalance",0)
FROM "bAccounts"
LEFT JOIN LATERAL
	(SELECT DISTINCT ON ("bAccountStatement"."accountId") 
	"bAccountStatement"."accountId", "bAccountStatement"."dateAcc"::date, "bAccountStatement"."closingBalance",
	"bAccountStatement"."totalCredit", "bAccountStatement"."totalDebit"
	 FROM "bAccountStatement" 
	 WHERE "bAccountStatement"."dateAcc"::date < $1 
	 ORDER BY "bAccountStatement"."accountId","dateAcc"::date DESC ) 
	 AS "IncomingBalances"
ON ("bAccounts"."accountId" = "IncomingBalances"."accountId")
where "bAccounts"."accountId" = $2
$BODY$;

ALTER FUNCTION public.f_getopeingbalancebyaccountid(date, numeric)
    OWNER TO postgres;
