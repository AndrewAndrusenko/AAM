-- FUNCTION: public.f_bbalancesheet(date)

DROP FUNCTION IF EXISTS public.stf_CheckOverdraftByLedgerAndByDate(date, numeric,numeric, numeric, numeric);
-- aa
CREATE OR REPLACE FUNCTION public.stf_CheckOverdraftByLedgerAndByDate(
	dateTransation date, ledgerId numeric , transactionxActTypeCode numeric, amountTransaction numeric, idTrasactionModifying numeric)
    RETURNS TABLE
	("ledgerId" numeric, "openingBalance" money, "CrSignAmount" money, "DbSignAmount" money,
	 "accountTransaction" money,
-- 	 "totalCredit" money, "totalDebit" money, 
	 "closingBalance" money) 
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000
-- uP(C):2+2, dP(D):2+1, uA(D):1+1, dA(C):1+2
AS $BODY$
select "IncomingBalances"."dateAcc", $2 AS "ledgerID", CAST(MAX("IncomingBalances"."closingBalance") AS MONEY) AS "openingBalance",
CAST(SUM (CASE ( "bcAccountType_Ext"."xActTypeCode")
	WHEN 1  THEN "amount" *-1
	WHEN 2 THEN "amount" 
END) FILTER (WHERE "bLedgerTransactions"."ledgerID"=$2) AS MONEY) AS "CrSignAmount",
CAST(SUM (CASE ("bcAccountType_Ext"."xActTypeCode")
	WHEN 1  THEN "amount" 
	WHEN 2  THEN "amount" *-1 
END) FILTER (WHERE "bLedgerTransactions"."ledgerID_Debit"=$2) AS MONEY) AS "DbSignAmount",
MAX("accountTransactionTotals"."sumAccountTransactions") AS "accountTransaction",
MAX("openingBalance" + "CrSignAmount" + "DbSignAmount" + "accountTransaction") AS "closingBalance"

 from "bLedger"
left join "bcAccountType_Ext" on "bcAccountType_Ext"."accountType_Ext" = "bLedger"."accountTypeID"
left join "bLedgerTransactions"	on 
("bLedger"."ledgerNoId" = "bLedgerTransactions"."ledgerID") OR ("bLedger"."ledgerNoId" = "bLedgerTransactions"."ledgerID_Debit")

LEFT JOIN LATERAL
(SELECT DISTINCT ON ("bLedgerStatement"."ledgerID") 
"bLedgerStatement"."ledgerID", "bLedgerStatement"."dateAcc"::date, "bLedgerStatement"."closingBalance",
"bLedgerStatement"."totalCredit", "bLedgerStatement"."totalDebit"
 FROM "bLedgerStatement" 
 WHERE "bLedgerStatement"."dateAcc"::date < $1 ORDER BY "bLedgerStatement"."ledgerID","dateAcc"::date DESC ) 
 AS "IncomingBalances"
ON ("bLedger"."ledgerNoId" = "IncomingBalances"."ledgerID")


left join 
(SELECT	"bLedger"."ledgerNoId", CAST(SUM (CASE ("bAccountTransaction"."XactTypeCode" + "bcAccountType_Ext"."xActTypeCode")
			WHEN 3 THEN "amountTransaction" * -1
			ELSE         "amountTransaction" 
		END) as money) 
	  AS "sumAccountTransactions"

FROM "bLedger"
LEFT JOIN "bcAccountType_Ext" ON "bcAccountType_Ext"."accountType_Ext" = "bLedger"."accountTypeID"

LEFT JOIN  public."bAccountTransaction"
ON "bLedger"."ledgerNoId" = "bAccountTransaction"."ledgerNoId"
WHERE 
		("bLedger"."ledgerNoId" = 2 AND
		"bAccountTransaction"."dataTime"::date <= $1 ::date AND 
		"bAccountTransaction"."dataTime"::date > "IncomingBalances"."dateAcc"::date)
GROUP BY "bLedger"."ledgerNoId"
) AS "accountTransactionTotals"
ON "bLedger"."ledgerNoId" = "accountTransactionTotals"."ledgerNoId"



where "bLedger"."ledgerNoId" = $2
$BODY$;

ALTER FUNCTION public.stf_CheckOverdraftByLedgerAndByDate(date, numeric, numeric, numeric, numeric)
    OWNER TO postgres;
