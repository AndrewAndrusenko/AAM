SELECT  id, "bLedger"."ledgerNo", "bcAccountType_Ext"."xActTypeCode", "accountId", "dataTime", "amountTransaction",  "bAccountTransaction"."ledgerNoId",
 "bAccountTransaction"."XactTypeCode" as "codeTransaction", "XactTypeCode_Ext", "entryDetails", "extTransactionId"
	FROM public."bAccountTransaction"
	  LEFT JOIN "bLedger" ON "bLedger"."ledgerNoId" = "bAccountTransaction"."ledgerNoId"
  LEFT JOIN "bcAccountType_Ext" ON "bLedger"."accountTypeID" = "bcAccountType_Ext"."accountType_Ext"
  WHERE "bAccountTransaction"."dataTime" >'2023-02-21'
-- XactTypeCode: 1 debit; codeTransaction: 1 debit
UNION
SELECT  id, "bLedger"."ledgerNo", "bcAccountType_Ext"."xActTypeCode", "ledgerID", "dateTime", amount, "ledgerID_Debit", 
2 as "codeTransaction", "XactTypeCode_Ext", "entryDetails", "extTransactionId"
	FROM public."bLedgerTransactions"
	  LEFT JOIN "bLedger" ON "bLedger"."ledgerNoId" = "bLedgerTransactions"."ledgerID"
  LEFT JOIN "bcAccountType_Ext" ON "bLedger"."accountTypeID" = "bcAccountType_Ext"."accountType_Ext"
  WHERE "bLedgerTransactions"."dateTime" >'2023-02-21'

UNION

SELECT id, "bLedger"."ledgerNo", "bcAccountType_Ext"."xActTypeCode",  "ledgerID_Debit", "dateTime", amount, "ledgerID", 
1 as "codeTransaction", "XactTypeCode_Ext", "entryDetails", "extTransactionId"
	FROM public."bLedgerTransactions"
	  LEFT JOIN "bLedger" ON "bLedger"."ledgerNoId" = "bLedgerTransactions"."ledgerID_Debit"
  LEFT JOIN "bcAccountType_Ext" ON "bLedger"."accountTypeID" = "bcAccountType_Ext"."accountType_Ext"
  WHERE "bLedgerTransactions"."dateTime" >'2023-02-21'
  ORDER by	1