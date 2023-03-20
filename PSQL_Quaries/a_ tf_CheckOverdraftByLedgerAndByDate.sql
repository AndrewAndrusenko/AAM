-- FUNCTION: public.f_checkoverdraftbyledgerandbydate(date, numeric, numeric, numeric, numeric)

-- DROP FUNCTION IF EXISTS public.f_checkoverdraftbyledgerandbydate(date, numeric, numeric, numeric, numeric);

CREATE OR REPLACE FUNCTION public.f_checkoverdraftbyledgerandbydate(
	datetransation date,
	ledgerid numeric,
	transactionxacttypecode numeric,
	amounttransaction numeric,
	idtrasactionmodifying numeric, 
	openedaccountingdate date
)
    RETURNS TABLE(
		"accountId" numeric, 
		"openingBalance" money, 
		"accountTransaction" money, 
		"CrSignAmount" money, "DbSignAmount" money, 
		"signedTransactionAmount" money) 
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$

select 
MAX("IncomingBalances"."ledgerId" ), 
MAX("IncomingBalances"."closingBalance") ,
COALESCE(MAX("accountTransactionTotals"."sumAccountTransactions"), 0) AS "sumAccountTransactions" ,

CAST(COALESCE(
		(SUM (CASE ( "bcAccountType_Ext"."xActTypeCode")
				WHEN 1  THEN "amount" *-1
				WHEN 2 THEN "amount" 
			 END) 
		 FILTER (
			WHERE 
			"bLedgerTransactions"."ledgerID"=$2 AND
			"id" !=$5 AND 
			"bLedgerTransactions"."dateTime"::date <= $1::date AND 
			"bLedgerTransactions"."dateTime"::date >= $6::date)
		 )
	, 0) 
AS MONEY) AS "CrSignAmount",
	 
CAST(
	COALESCE(
		SUM (CASE ("bcAccountType_Ext"."xActTypeCode")
				WHEN 1  THEN "amount" 
				WHEN 2  THEN "amount" *-1 
			 END) 
		FILTER 
		 (WHERE 
			"bLedgerTransactions"."ledgerID_Debit"=$2 AND
			"id" !=$5 AND 
			"bLedgerTransactions"."dateTime"::date <= $1::date AND 
			"bLedgerTransactions"."dateTime"::date >= $6::date
		 )
	, 0)
AS MONEY) AS "DbSignAmount", 
	
CAST(CASE ($3 + "bcAccountType_Ext"."xActTypeCode")
		WHEN 3 THEN $4 * -1
		ELSE        $4
	END as money) 
  AS "signedTransactionAmount"
	
FROM f_getOpeingBalancebyLedgerId ($1,$2) AS "IncomingBalances"
left join "bcAccountType_Ext" ON "bcAccountType_Ext"."accountType_Ext" = "IncomingBalances"."accountTypeID"
left join "bLedgerTransactions"	on 
("IncomingBalances"."ledgerId" = "bLedgerTransactions"."ledgerID") OR ("IncomingBalances"."ledgerId"  = "bLedgerTransactions"."ledgerID_Debit")

left join LATERAL
(SELECT	"bLedger"."ledgerNoId", SUM (CASE ("bAccountTransaction"."XactTypeCode" + "bcAccountType_Ext"."xActTypeCode")
			WHEN 3 THEN "amountTransaction" * -1
			ELSE         "amountTransaction" 
		END) 
	  AS "sumAccountTransactions"
FROM "bLedger"
LEFT JOIN "bcAccountType_Ext" ON "bcAccountType_Ext"."accountType_Ext" = "bLedger"."accountTypeID"
LEFT JOIN  public."bAccountTransaction"
ON "bLedger"."ledgerNoId" = "bAccountTransaction"."ledgerNoId"
WHERE 
		("bLedger"."ledgerNoId" = $2 AND
		"id" !=$5 AND 
		"bAccountTransaction"."dataTime"::date <= $1 ::date AND 
		"bAccountTransaction"."dataTime"::date >= $6::date)
GROUP BY "bLedger"."ledgerNoId"
) AS "accountTransactionTotals"

ON "IncomingBalances"."ledgerId" = "accountTransactionTotals"."ledgerNoId"
where "IncomingBalances"."ledgerId" = $2 
GROUP BY "bcAccountType_Ext"."xActTypeCode"
$BODY$;

ALTER FUNCTION public.f_checkoverdraftbyledgerandbydate(date, numeric, numeric, numeric, numeric)
    OWNER TO postgres;
