select "bLedger"."ledgerNo", "bAccounts"."accountNo", "bcTransactionType_Ext"."xActTypeCode_Ext", "bcTransactionType_DE"."name", json_populate_recordset.*
from json_populate_recordset(null::public."bAccountTransaction",
'[
 {"ledgerNoId":"1","dataTime":"2023-02-20T21:00:00.000Z","XactTypeCode":"1","XactTypeCode_Ext":"3","accountId":"3",
 "amountTransaction":"1500000","entryDetails":"Incoming payment CHASUS33XXX to with ref: CHAS1247","extTransactionId":"1"}
]'
 )
LEFT JOIN "bcTransactionType_Ext" ON "bcTransactionType_Ext".id = json_populate_recordset."XactTypeCode_Ext"
LEFT JOIN "bcTransactionType_DE" ON "bcTransactionType_DE"."xActTypeCode" = json_populate_recordset."XactTypeCode" 
LEFT JOIN "bLedger" ON "bLedger"."ledgerNoId" = json_populate_recordset."ledgerNoId"	
LEFT JOIN "bAccounts" ON "bAccounts"."accountId" = json_populate_recordset."accountId";		 
