SELECT "bcAccountType_Ext"."xActTypeCode" ,"bAccounts"."accountNo", "bAccountStatement"."dateAcc", "bAccountStatement"."closingBalance"  FROM "bAccountStatement"
LEFT JOIN "bAccounts" ON "bAccounts"."accountId" = "bAccountStatement"."accountId"
LEFT JOIN "bcAccountType_Ext" ON "bAccounts"."accountTypeExt" = "bcAccountType_Ext"."accountType_Ext"

