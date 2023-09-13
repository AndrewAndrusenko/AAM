SELECT b_accounts_balance."closingBalance",b_depo_accounts_balance."closingBalance", dtrades_allocated.id, dtrades_allocated.qty, 
dtrades_allocated.idtrade, dtrades_allocated.idportfolio,
id_order,dtrades_allocated.id_bulk_order, dportfolios.portfolioname,  dtrades.tdate as tdate,
ROUND(dtrades.trade_amount/dtrades.qty*dtrades_allocated.qty,2) as trade_amount, dtrades.accured_interest,id_settlement_currency,
50000 as current_postion_qty, 200000 as current_account_balance,"bAccounts"."accountId","bAccountsDepo"."accountId" as "depoAccountId", 
"entriesForAllocation".count as "entries" FROM public.dtrades_allocated 
LEFT JOIN dtrades ON dtrades_allocated.idtrade = dtrades.idtrade 
LEFT JOIN dportfolios ON dtrades_allocated.idportfolio = dportfolios.idportfolio
LEFT JOIN (SELECT * FROM "bAccounts" WHERE "bAccounts"."accountTypeExt"=8) as "bAccounts" 
ON dtrades_allocated.idportfolio = "bAccounts".idportfolio 
LEFT JOIN (SELECT * FROM "bAccounts" WHERE "bAccounts"."accountTypeExt"=15) as "bAccountsDepo" 
ON (dtrades_allocated.idportfolio = "bAccountsDepo".idportfolio  and dtrades.tidinstrument="bAccountsDepo".secid)
LEFT JOIN "entriesForAllocation" ON dtrades_allocated.id = "entriesForAllocation".idtrade
LEFT JOIN LATERAL (
SELECT "accountId", "openingBalance", CAST ("closingBalance" AS NUMERIC) AS "closingBalance", "closingBalance" AS "EndBalance"
  FROM f_checkoverdraftbyaccountandbydate
  (dtrades.tdate, "bAccounts"."accountId", 1, 0, 0, '03/29/2023')) as b_accounts_balance 
  ON "bAccounts"."accountId"=b_accounts_balance."accountId" 
LEFT JOIN LATERAL (
SELECT "accountId", "openingBalance", CAST ("closingBalance" AS NUMERIC) AS "closingBalance", "closingBalance" AS "EndBalance"
  FROM f_checkoverdraftbyaccountandbydate
  (dtrades.tdate, "bAccountsDepo"."accountId", 1, 0, 0, '03/29/2023')) as b_depo_accounts_balance 
  ON "bAccountsDepo"."accountId"=b_depo_accounts_balance."accountId" 
     WHERE id=503