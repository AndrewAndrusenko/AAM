SELECT "bLedgerTransactions".id AS "t_id", "entryDetails" AS "t_entryDetails", "bLedgerTransactions"."ledgerID_Debit" AS "t_ledgerNoId", 
"bLedgerTransactions"."ledgerID" AS "t_accountId", "dateTime" AS "t_dataTime", "extTransactionId" AS "t_extTransactionId",
"amount" AS "t_amountTransaction", 0 AS "t_XactTypeCode", "bLedgerTransactions"."XactTypeCode_Ext" AS "t_XactTypeCode_Ext" , 
"bcTransactionType_Ext"."description" ||': ' || "bLedgerTransactions"."entryDetails" as "d_entryDetails", 
"bLedgerTransactions"."ledgerID_Debit" AS "d_Debit",
"bLedgerTransactions"."ledgerID" AS "d_Credit",
"bLedger"."ledgerNo" AS "d_ledgerNo", "bLedger2"."ledgerNo" AS "d_accountNo", 0 AS "d_xActTypeCodeExtName" 
FROM "bLedgerTransactions" 
LEFT join "bcTransactionType_Ext" ON "bLedgerTransactions"."XactTypeCode_Ext" = "bcTransactionType_Ext".id 
LEFT JOIN "bLedger"  ON "bLedger"."ledgerNoId" = "bLedgerTransactions"."ledgerID" 
LEFT JOIN "bLedger" AS "bLedger2" ON "bLedger2"."ledgerNoId" = "bLedgerTransactions"."ledgerID_Debit"
ORDER BY "dateTime" DESC 