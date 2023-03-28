-- FUNCTION: public.f_all_ledger_transactions_from_date(date)
CREATE OR REPLACE FUNCTION public.f_b_close_balance_for_date(
	dateb date)
    RETURNS TABLE ("dateAcc" date, "closingBalance" numeric, "totalCredit" numeric, "totalDebit" numeric, "accountId" numeric) 
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
INSERT INTO "bAccountStatement"
("dateAcc", "closingBalance", "totalCredit", "totalDebit", "accountId")
  SELECT "dateAcc", "closingBalance", "totalCredit", "totalDebit", "accountId" 
  FROM f_accounts_balance_closure_select_data($1::date)
RETURNING "dateAcc", "closingBalance", "totalCredit", "totalDebit", "accountId";

INSERT INTO "bLedgerStatement"
("ledgerID", "closingBalance", "totalDebit", "totalCredit", "dateAcc")
SELECT 
"ledgerID", "closingBalance", "totalDebit", "totalCredit", "dateAcc"
FROM f_ledger_balance_closure_select_data($1::date) 
RETURNING "dateAcc", "closingBalance", "totalCredit", "totalDebit", "ledgerID";
$BODY$;

ALTER FUNCTION public.f_b_close_balance_for_date(date)
    OWNER TO postgres;
