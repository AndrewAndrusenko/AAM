SELECT "ledgerNoId", "dataTime", "XactTypeCode", "XactTypeCode_Ext", "accountId", id, "amountTransaction", "entryDetails", "extTransactionId"
	FROM public."bAccountTransaction"
	where "accountId" = 1 AND "dataTime"> '2023-02-21' and "dataTime"<='2023-02-28'
	