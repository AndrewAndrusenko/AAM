SELECT	CAST(SUM (CASE ("bAccountTransaction"."XactTypeCode" + "bcAccountType_Ext"."xActTypeCode")
			WHEN 3 THEN "amountTransaction" * -1
			ELSE         "amountTransaction" 
		END) as money) 
	  AS "sumAccountTransactions"

FROM "bLedger"
LEFT JOIN "bcAccountType_Ext" ON "bcAccountType_Ext"."accountType_Ext" = "bLedger"."accountTypeID"

LEFT JOIN public."bAccountTransaction"
ON "bLedger"."ledgerNoId" = "bAccountTransaction"."ledgerNoId"
WHERE 
		("bLedger"."ledgerNoId" = 2 AND
		"bAccountTransaction"."dataTime"::date <= '2023-03-19'::date AND 
		"bAccountTransaction"."dataTime"::date > '2023-02-21'::date)