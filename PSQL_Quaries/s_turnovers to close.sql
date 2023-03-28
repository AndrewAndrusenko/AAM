 SELECT  "accountId" , "closingBalance", "totalCredit", "totalDebit","dateAcc"
  FROM f_accounts_balance_closure_select_data('2023-02-24'::date)
UNION
SELECT 
"ledgerID", "closingBalance", "totalDebit", "totalCredit", "dateAcc"
FROM f_ledger_balance_closure_select_data('2023-02-24'::date) 