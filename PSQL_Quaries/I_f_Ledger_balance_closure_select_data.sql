INSERT INTO "bLedgerStatement"
("ledgerID", "closingBalance", "totalDebit", "totalCredit", "dateAcc")
SELECT 
"ledgerID", "closingBalance", "totalDebit", "totalCredit", "dateAcc"
from f_ledger_balance_closure_select_data('2023-02-20') 
