INSERT INTO public."bAccountTransaction"(
	"ledgerNoId" ,"dataTime", "XactTypeCode", "XactTypeCode_Ext", "accountId", "amountTransaction", "entryDetails", "extTransactionId")
	(SELECT "ledgerNoId" ,'2023-02-22', "XactTypeCode", "XactTypeCode_Ext", "accountId", "amountTransaction", "entryDetails", "extTransactionId"
	from "bAccountTransaction" WHERE "dataTime" = '2023-02-21'
	)
