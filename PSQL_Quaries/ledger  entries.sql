SELECT idtrade,id, "ledgerID", "dateTime"::date, amount, "ledgerID_Debit", "XactTypeCode_Ext", "entryDetails", "extTransactionId"
	FROM public."bLedgerTransactions" 
-- 	 where "dateTime"='09/24/2023'
	order by id desc