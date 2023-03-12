SELECT 
"accountTypeID", name, "clientID", "entityTypeCode", "ledgerNo", "currecyCode", 
"ledgerNoCptyCode", "ledgerNoTrade", "externalAccountNo", "ledgerNoId", 
"bcAccountType_Ext"."actCodeShort" ||': ' || "bcAccountType_Ext"."description" as "d_Account_Type",
"dclients"."clientname" as "d_Client", "bcAccountType_Ext"."APTypeCode" as "d_APTypeCodeAccount"
	FROM public."bLedger"
	LEFT JOIN "dclients" ON "bLedger"."clientID" = "dclients".idclient
	LEFT JOIN "bcAccountType_Ext" ON "bcAccountType_Ext"."accountType_Ext" = "bLedger"."accountTypeID" ;