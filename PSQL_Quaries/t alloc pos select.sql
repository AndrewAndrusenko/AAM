SELECT dtrades_allocated.id,b_depo_accounts_balance."closingBalance" as depo_account_balance, f_fifo_select_current_positions_for_trade.position, dtrades_allocated.qty, dtrades_allocated.idtrade, dtrades_allocated.idportfolio, id_order,dtrades_allocated.id_bulk_order, dportfolios.portfolioname, ROUND(dtrades.trade_amount/dtrades.qty*dtrades_allocated.qty,2) as trade_amount, dtrades.accured_interest,id_settlement_currency, "bAccounts"."accountId","bAccountsDepo"."accountId" as "depoAccountId", 
"entriesForAllocation".count as "entries",dtrades.tidinstrument as secid,dtrades.tdate,dtrades.trtype,dtrades.price,dtrades.id_price_currency ,
b_accounts_balance."closingBalance" as current_account_balance
FROM public.dtrades_allocated LEFT JOIN dtrades ON dtrades_allocated.idtrade = dtrades.idtrade 
LEFT JOIN dportfolios ON dtrades_allocated.idportfolio = dportfolios.idportfolio 
LEFT JOIN (SELECT * FROM "bAccounts" WHERE "bAccounts"."accountTypeExt"=8) as "bAccounts"  ON dtrades_allocated.idportfolio = "bAccounts".idportfolio
LEFT JOIN (SELECT * FROM "bAccounts" WHERE "bAccounts"."accountTypeExt"=15) as "bAccountsDepo"  ON (dtrades_allocated.idportfolio = "bAccountsDepo".idportfolio  and dtrades.tidinstrument="bAccountsDepo".secid)
LEFT JOIN "entriesForAllocation" ON dtrades_allocated.id = "entriesForAllocation".idtrade
LEFT JOIN  ( select * from f_fifo_select_current_positions_for_trade('GOOG-RM') ) 
as f_fifo_select_current_positions_for_trade on dtrades_allocated.idportfolio = f_fifo_select_current_positions_for_trade.idportfolio
LEFT JOIN LATERAL (SELECT "accountId", "openingBalance", CAST ("closingBalance" AS NUMERIC) AS "closingBalance", "closingBalance" AS "EndBalance" FROM f_checkoverdraftbyaccountandbydate    (dtrades.tdate, "bAccounts"."accountId", 1, 0, 0, 'Thu May 04 2023')) as b_accounts_balance  ON "bAccounts"."accountId"=b_accounts_balance."accountId"   
LEFT JOIN LATERAL (  SELECT "accountId", "openingBalance", CAST ("closingBalance" AS NUMERIC) AS "closingBalance", "closingBalance" AS "EndBalance" FROM f_checkoverdraftbyaccountandbydate    (dtrades.tdate, "bAccountsDepo"."accountId", 1, 0, 0, 'Thu May 04 2023')) as b_depo_accounts_balance    

ON "bAccountsDepo"."accountId"=b_depo_accounts_balance."accountId"  WHERE(dtrades_allocated.idtrade =  '120')
ORDER BY dtrades_allocated.idtrade DESC