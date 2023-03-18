select *, 
"openingBalance" + "sumLedgerTransactions" + "sumAccountTransactions" + "currentTransaction" as "closingBalance" 
from stf_CheckOverdraftByLedgerAndByDate('2023-03-18',2,2,500,2)
