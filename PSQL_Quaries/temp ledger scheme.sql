SELECT "bLedger"."ledgerNo", "bLedgerDebit"."ledgerNo", "bcTransactionType_Ext"."xActTypeCode_Ext", 
"bcTransactionType_DE"."name", json_populate_recordset.*
FROM json_populate_recordset(null::public."bcSchemeLedgerTransaction",
'[{"ledgerNoId":"7","dataTime":"9/1/2023","ledgerID_Debit":"9","amount":"2000","entryDetails":"Investment purchase of GGOG_RM under transaction id 10 and trade id 102","XactTypeCode":"2","XactTypeCode_Ext":"5","extTransactionId":null,"idtrade":"102"}]') 
LEFT JOIN "bcTransactionType_Ext" ON "bcTransactionType_Ext".id = json_populate_recordset."XactTypeCode_Ext" 
LEFT JOIN "bcTransactionType_DE" ON "bcTransactionType_DE"."xActTypeCode" = json_populate_recordset."XactTypeCode" 
LEFT JOIN "bLedger" ON "bLedger"."ledgerNoId"::text = json_populate_recordset."ledgerNoId" 
LEFT JOIN "bLedger" AS "bLedgerDebit" ON "bLedgerDebit"."ledgerNoId"::text = json_populate_recordset."ledgerID_Debit"
