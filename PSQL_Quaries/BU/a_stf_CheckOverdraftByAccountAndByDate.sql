-- FUNCTION: public.stf_checkoverdraftbyaccountandbydate(date, numeric, numeric, numeric, numeric)

DROP FUNCTION IF EXISTS public.stf_checkoverdraftbyaccountandbydate(date, numeric, numeric, numeric, numeric);

CREATE OR REPLACE FUNCTION public.stf_checkoverdraftbyaccountandbydate(
	datetransation date,
	accountid numeric,
	transactionxacttypecode numeric,
	amounttransaction numeric,
	idtrasactionmodifying numeric)
    RETURNS TABLE("accountId" numeric, "openingBalance" money, "closingBalance" money) 
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
SELECT 
"bAccountTransaction"."accountId", "IncomingBalances"."closingBalance" AS "openingBalance",
COALESCE(
	SUM 
		(CASE ("bAccountTransaction"."XactTypeCode" + "bcAccountType_Ext"."xActTypeCode")
			WHEN 3 THEN "amountTransaction"
			ELSE         "amountTransaction"*-1
		END)  
	FILTER (WHERE 
		"id" !=$5 AND 
		"bAccountTransaction"."dataTime"::date <= $1::date AND 
		"bAccountTransaction"."dataTime"::date > "IncomingBalances"."dateAcc"::date)
,0) 
+ "IncomingBalances"."closingBalance" + 
CASE ( $3 + "bcAccountType_Ext"."xActTypeCode")
	WHEN 3 THEN $4
	ELSE $4*-1
END  AS "closingBalance"
FROM f_getopeingbalancebyaccountid ($1,$2) AS "IncomingBalances"
left join "bcAccountType_Ext" ON "bcAccountType_Ext"."accountType_Ext" = "IncomingBalances"."accountTypeID"
left join "bAccountTransaction"	ON ("IncomingBalances"."accountId" = "bAccountTransaction"."accountId") 
LEFT JOIN "bAccounts" ON ("bAccounts"."accountId" = "IncomingBalances"."accountId")

WHERE  "IncomingBalances"."accountId" = $2
GROUP BY "bcAccountType_Ext"."xActTypeCode" ,"bAccountTransaction"."accountId", "IncomingBalances"."closingBalance";

$BODY$;

ALTER FUNCTION public.stf_checkoverdraftbyaccountandbydate(date, numeric, numeric, numeric, numeric)
    OWNER TO postgres;
