select 
"accountNo", "accountId", 'Account', null ,"dataTime" , "corrOpeningBalance" ::money,"totalDebit" ::money,  "totalCredit"  ::money, 
 ("corrOpeningBalance" + "signedTurnOver")::money AS "OutGoingBalance" , 0
from f_bcurrent_ledger_turnovers_balances_notclosed('2023-02-21')
WHERE "accountId"=5
