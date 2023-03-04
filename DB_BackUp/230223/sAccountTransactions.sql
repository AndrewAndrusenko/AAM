SELECT "bAccountTransaction".id as entryAcountTransactionId , "dataTime", "bcTransactionType_DE"."name" as "XactTypeCode",  "bcTransactionType_Ext"."xActTypeCode_Ext", 
"bLedger"."ledgerNoId" , "bLedger"."ledgerNo", 
 "bAccounts"."accountId" , "bAccounts"."accountNo",  
 "amountTransaction", "entryDetails", 
 "extTransactionId"
	FROM "bAccountTransaction"
	LEFT join "bcTransactionType_Ext" ON "bAccountTransaction"."XactTypeCode_Ext" = "bcTransactionType_Ext".id
	LEFT join public."bcTransactionType_DE" ON "bcTransactionType_DE"."xActTypeCode" = "bAccountTransaction"."XactTypeCode" 
	LEFT JOIN "bAccounts" on "bAccounts"."accountId" = "bAccountTransaction"."accountId"
	LEFT JOIN "bLedger" ON "bLedger"."ledgerNoId" = "bAccountTransaction"."ledgerNoId";