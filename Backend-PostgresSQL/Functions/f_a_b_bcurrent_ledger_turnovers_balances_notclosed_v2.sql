-- FUNCTION: public.f_a_b_bcurrent_ledger_turnovers_balances_notclosed(date)

-- DROP FUNCTION IF EXISTS public.f_a_b_bcurrent_ledger_turnovers_balances_notclosed_v2(date,daterange, numeric[], text[]);

CREATE OR REPLACE FUNCTION public.f_a_b_bcurrent_ledger_turnovers_balances_notclosed_v2(
	lastclosedbalancedate date,
	p_date_balance_range daterange,
	p_account_types numeric[],
	p_accounts_list text[])
    RETURNS TABLE("accountTypeID" numeric,"accountId" numeric, "accountNo" text, "dataTime" date, "xActTypeCode" integer, "openingBalance" numeric, "corrOpeningBalance" numeric, "signedTurnOver" numeric, "totalCredit" numeric, "totalDebit" numeric) 
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
 
-- Balance sheet for entries within not closed dates. There are no data in table bAccountStatments for these entries
-- View show calculated openingBalance based on the last closed balance and correction as a signed sum of entries from last closed date 
-- till the date of balance sheet row
-- Second view calculate turnovers for the given date. Closing balance for the given date could be calulated using selelct statement from the view
SELECT 
"ledgerTransactions"."accountTypeID",
"ledgerTransactions"."accountID",
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
		  ELSE tr."amountTransaction" * -1
		END) 
    AS "sCorr"
	FROM  f_a_b_all_ledger_transactions_from_date ($1::date) tr
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
    COALESCE(sum("ledgerTransactions"."amountTransaction") FILTER (WHERE "ledgerTransactions"."codeTransaction" = 1), 0.00) 
	AS "totalCredit",
    COALESCE(sum("ledgerTransactions"."amountTransaction") FILTER (WHERE "ledgerTransactions"."codeTransaction" = 2), 0.00) 
	AS "totalDebit"
FROM f_a_b_all_ledger_transactions_from_date ($1::date) as "ledgerTransactions"
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
WHERE 
  (p_date_balance_range ISNULL OR  p_date_balance_range@>"ledgerTransactions"."dataTime"::date) AND
  (p_accounts_list ISNULL OR "ledgerTransactions"."accountNo"=ANY(p_accounts_list)) AND
  (p_account_types ISNULL OR "ledgerTransactions"."accountTypeID"=ANY(p_account_types))
GROUP BY "ledgerTransactions"."accountID", "ledgerTransactions"."accountNo", "ledgerTransactions"."dataTime", "IncomingBalances"."closingBalance", 
"ledgerTransactions"."xActTypeCode","ledgerTransactions"."accountTypeID"
ORDER BY ("ledgerTransactions"."dataTime"::date) DESC;

$BODY$;

ALTER FUNCTION public.f_a_b_bcurrent_ledger_turnovers_balances_notclosed_v2(date,daterange, numeric[], text[])
    OWNER TO postgres;
		select * from f_a_b_bcurrent_ledger_turnovers_balances_notclosed_v2('3/7/2024',
	'[3/10/2024,3/15/2024]'::daterange,
										  array[8,10],null
-- 										  array['ClearAll', '40820840PANDRW001', '40807840CLIEN3001' ]
)

