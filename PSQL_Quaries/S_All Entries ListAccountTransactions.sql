SELECT "bLedgerTransactions".id AS "t_id", "entryDetails" AS "t_entryDetails", "bLedgerTransactions"."ledgerID_Debit" AS "t_ledgerNoId", 
"bLedgerTransactions"."ledgerID" AS "t_accountId", "dateTime" AS "t_dataTime", "extTransactionId" AS "t_extTransactionId",
"amount" AS "t_amountTransaction", 0 AS "t_XactTypeCode", "bLedgerTransactions"."XactTypeCode_Ext" AS "t_XactTypeCode_Ext" , 
"bcTransactionType_Ext"."description" ||': ' || "bLedgerTransactions"."entryDetails" as "d_entryDetails", 
"bLedgerDebit"."ledgerNo" AS "d_Debit",
"bLedger"."ledgerNo" AS "d_Credit",
"bLedger"."ledgerNo" AS "d_ledgerNo", "bLedgerDebit"."ledgerNo" AS "d_accountNo", '0' AS "d_xActTypeCodeExtName" 
FROM "bLedgerTransactions" 
LEFT join "bcTransactionType_Ext" ON "bLedgerTransactions"."XactTypeCode_Ext" = "bcTransactionType_Ext".id 
LEFT JOIN "bLedger"  ON "bLedger"."ledgerNoId" = "bLedgerTransactions"."ledgerID" 
LEFT JOIN "bLedger" AS "bLedgerDebit" ON "bLedgerDebit"."ledgerNoId" = "bLedgerTransactions"."ledgerID_Debit"
UNION

SELECT "bAccountTransaction".id AS "t_id", "entryDetails" AS "t_entryDetails", "bAccountTransaction"."ledgerNoId" AS "t_ledgerNoId", 
"bAccountTransaction"."accountId" AS "t_accountId", "dataTime" AS "t_dataTime", "extTransactionId" AS "t_extTransactionId", 
"amountTransaction" AS "t_amountTransaction", "XactTypeCode" AS "t_XactTypeCode", 
"bAccountTransaction"."XactTypeCode_Ext" AS "t_XactTypeCode_Ext" , "bcTransactionType_Ext"."description" ||': ' || "bAccountTransaction"."entryDetails" as "d_entryDetails", 
CASE "bAccountTransaction"."XactTypeCode" WHEN 1 THEN  "bLedger"."ledgerNo" WHEN 2 THEN "bAccounts"."accountNo" END as "d_Debit",CASE "bAccountTransaction"."XactTypeCode" WHEN 2 THEN "bLedger"."ledgerNo" WHEN 1 THEN "bAccounts"."accountNo" END as "d_Credit","ledgerNo" AS "d_ledgerNo", "accountNo" AS "d_accountNo", "bcTransactionType_Ext"."xActTypeCode_Ext" AS "d_xActTypeCodeExtName" FROM "bAccountTransaction" LEFT join "bcTransactionType_Ext" ON "bAccountTransaction"."XactTypeCode_Ext" = "bcTransactionType_Ext".id LEFT JOIN "bAccounts" on "bAccounts"."accountId" = "bAccountTransaction"."accountId" LEFT JOIN "bLedger" ON "bLedger"."ledgerNoId" = "bAccountTransaction"."ledgerNoId" 
ORDER BY "t_dataTime" DESC