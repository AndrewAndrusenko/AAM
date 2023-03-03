SELECT "bLedger"."ledgerNo", "dataTime", "bcTransactionType_DE"."name", 
 "bcTransactionType_Ext"."xActTypeCode_Ext",
 "bAccounts"."accountNo",  "amountTransaction", "entryDetails", "extTransactionId"
	FROM public."bAccountTransaction"
	LEFT join "bcTransactionType_Ext" ON "bAccountTransaction"."XactTypeCode_Ext" = "bcTransactionType_Ext".id
	LEFT join public."bcTransactionType_DE" ON "bcTransactionType_DE"."xActTypeCode" = "bAccountTransaction"."XactTypeCode" 
	LEFT JOIN "bAccounts" on "bAccounts"."accountId" = "bAccountTransaction"."accountId"
	LEFT JOIN "bLedger" ON "bLedger"."ledgerNoId" = "bAccountTransaction"."ledgerNoId";