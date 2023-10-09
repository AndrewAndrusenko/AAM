select "accountNo", secid, b_accounts_balance.*, * FROM "bAccounts"
left join lateral (
   SELECT "accountId", "openingBalance", CAST ("closingBalance" AS NUMERIC) AS "closingBalance", "closingBalance" AS "EndBalance"
         FROM f_checkoverdraftbyaccountandbydate
          ('2023-10-01', "bAccounts"."accountId", 1, 0, 0, '2023-05-04')
) as b_accounts_balance 
          ON "bAccounts"."accountId"=b_accounts_balance."accountId" 
where idportfolio=ANY(array[7,2,29,25]) and "accountTypeExt"!=13 and b_accounts_balance."closingBalance"!=0
