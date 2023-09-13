SELECT "bAccounts"."accountNo",
    "bAccounts"."accountTypeExt",
    "bAccounts"."Information",
    "bAccounts"."clientId",
    "bAccounts"."currencyCode",
    "bAccounts"."entityTypeCode",
    "bAccounts"."accountId",
    "bAccounts"."dateOpening",
    "bAccounts".idportfolio
   FROM "bAccounts"
    
  WHERE "bAccounts"."dateOpening" <= '08/15/2023' AND ("dateClosing">='08/15/2023' OR "dateClosing" ISNULL );