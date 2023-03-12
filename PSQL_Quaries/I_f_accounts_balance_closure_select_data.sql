INSERT INTO "bAccountStatement"
 ("dateAcc", "closingBalance", "totalCredit", "totalDebit", "accountId")
 (SELECT "dateAcc", "closingBalance", "totalCredit", "totalDebit", "accountId" FROM f_accounts_balance_closure_select_data('2023-02-19'))