INSERT INTO public."bcSchemeAccountTransaction"(
	  "ledgerNo",    "dataTine", "XactTypeCode", "XactTypeCode_Ext", "accountID",  "amountTransaction", "accountNo", "entryDetails", "cSchemeGroupId", "cDate", "cxActTypeCode_Ext", "cxActTypeCode")
	VALUES 
	('${pLedgerNo}', '${pDate_T}', 'CR','DP', '${pAccountNo}','${pAmount}', '', 'entryDetails', 'DP_NOSTRO_IN', 'pDate_T', 'DP', 'CR');