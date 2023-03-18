SELECT 
case "ledgerID" WHEN 2 THEN 'C' ELSE 'D' END  AS "Side",
id, "ledgerID", "dateTime", amount, "ledgerID_Debit", "XactTypeCode_Ext", "entryDetails", "extTransactionId"
	FROM public."bLedgerTransactions"
	order by "Side"