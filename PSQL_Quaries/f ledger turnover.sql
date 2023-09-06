-- FUNCTION: public.f_bcurrent_ledger_turnovers_balances_notclosed(date)

-- DROP FUNCTION IF EXISTS public.f_bcurrent_ledger_turnovers_balances_notclosed(date);

CREATE OR REPLACE FUNCTION public.f_bcurrent_ledger_turnovers_balances_notclosed(
	lastclosedbalancedate date)
    RETURNS TABLE("accountId" numeric, "accountNo" text, "dataTime" date, "xActTypeCode" integer, "openingBalance" numeric, "corrOpeningBalance" numeric, "signedTurnOver" numeric, "totalCredit" numeric, "totalDebit" numeric) 
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
 
-- Balance sheet for entries within not closed dates. There are no data in table bAccountStatments for these entries
-- View show calculated openingBalance based on the last closed balance and correction as a signed sum of entries from last closed date 
-- till the date of balance sheet row
-- Second view calculate turnovers for the given date. Closing balance for the given date could be calulated using selelct statement from the view
SELECT "ledgerTransactions"."accountID",
  "ledgerTransactions"."accountNo",
  "ledgerTransactions"."dataTime"::date AS "dataTime",
  "ledgerTransactions"."xActTypeCode",
  COALESCE("IncomingBalances"."closingBalance", 0) AS "openingBalance",
  COALESCE("IncomingBalances"."closingBalance", 0) + 
  COALESCE(
	(SELECT 
	  SUM(
		CASE tr."codeTransaction" + "ledgerTransactions"."xActTypeCode"
		  WHEN 3 THEN tr."amountTransaction"
		  ELSE tr."amountTransaction" * '-1'::integer::numeric
		END) 
    AS "sCorr"
	FROM  f_all_ledger_transactions_from_date ($1::date) tr
	WHERE 
	  tr."accountID" = "ledgerTransactions"."accountID" AND 
	  tr."dataTime"::date < "ledgerTransactions"."dataTime"::date), 
  0::real) 
  AS "corrOpeningBalance",
  SUM(
	CASE "ledgerTransactions"."codeTransaction" + "ledgerTransactions"."xActTypeCode"
		WHEN 3 THEN "ledgerTransactions"."amountTransaction"
		ELSE "ledgerTransactions"."amountTransaction" * -1
	END) 
	AS "closingBalance",
    COALESCE(sum("ledgerTransactions"."amountTransaction") FILTER (WHERE "ledgerTransactions"."codeTransaction" = 1)::real, 0.0) 
	AS "totalCredit",
    COALESCE(sum("ledgerTransactions"."amountTransaction") FILTER (WHERE "ledgerTransactions"."codeTransaction" = 2)::real, 0.0) 
	AS "totalDebit"
FROM f_all_ledger_transactions_from_date ($1::date) as "ledgerTransactions"
  LEFT JOIN 
  (SELECT DISTINCT ON ("bLedgerStatement"."ledgerID") "bLedgerStatement"."ledgerID",
	"bLedgerStatement"."dateAcc",
	"bLedgerStatement"."closingBalance",
	"bLedgerStatement"."totalCredit",
	"bLedgerStatement"."totalDebit"
  FROM "bLedgerStatement"
  WHERE "bLedgerStatement"."dateAcc" <= $1::date
  ORDER BY "bLedgerStatement"."ledgerID", "bLedgerStatement"."dateAcc" DESC) "IncomingBalances" 
  ON "ledgerTransactions"."accountID" = "IncomingBalances"."ledgerID"
GROUP BY "ledgerTransactions"."accountID", "ledgerTransactions"."accountNo", "ledgerTransactions"."dataTime", "IncomingBalances"."closingBalance", 
"ledgerTransactions"."xActTypeCode"
ORDER BY ("ledgerTransactions"."dataTime"::date) DESC;

$BODY$;

ALTER FUNCTION public.f_bcurrent_ledger_turnovers_balances_notclosed(date)
    OWNER TO postgres;
