SELECT "accountId", "openingBalance", 
CAST ("closingBalance" AS NUMERIC) AS "closingBalance", "closingBalance" 
AS "EndBalance"FROM f_checkoverdraftbyaccountandbydate('Fri Mar 17 2023', '5','0','12000000','7')