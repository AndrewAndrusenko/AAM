-- FUNCTION: public.f_all_ledger_transactions_from_date(date)

-- DROP FUNCTION IF EXISTS public.f_all_ledger_transactions_from_date(date);

CREATE OR REPLACE FUNCTION public.f_all_ledger_transactions_from_date(
	dateb date)
    RETURNS TABLE(id numeric, "accountNo" text, "xActTypeCode" integer, "accountID" numeric, "dataTime" date, "amountTransaction" numeric, "ledgerNoId" numeric, "codeTransaction" integer, "XactTypeCode_Ext" integer, "entryDetails" text, exttransactionid numeric) 
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
SELECT  id, "bLedger"."ledgerNo", "bcAccountType_Ext"."xActTypeCode", "bAccountTransaction"."ledgerNoId", "dataTime", "amountTransaction",  "accountId",
(CASE "bAccountTransaction"."XactTypeCode" WHEN 1 THEN 2 ELSE 1 END) AS "codeTransaction", "XactTypeCode_Ext", "entryDetails", "extTransactionId"
	FROM public."bAccountTransaction"
	  LEFT JOIN "bLedger" ON "bLedger"."ledgerNoId" = "bAccountTransaction"."ledgerNoId"
  LEFT JOIN "bcAccountType_Ext" ON "bLedger"."accountTypeID" = "bcAccountType_Ext"."accountType_Ext"
  WHERE "bAccountTransaction"."dataTime"::date  >= $1::date
-- XactTypeCode: 1 debit; codeTransaction: 1 debit
UNION
SELECT  id, "bLedger"."ledgerNo", "bcAccountType_Ext"."xActTypeCode", "ledgerID", "dateTime", amount, "ledgerID_Debit", 
1 as "codeTransaction", "XactTypeCode_Ext", "entryDetails", "extTransactionId"
	FROM public."bLedgerTransactions"
	  LEFT JOIN "bLedger" ON "bLedger"."ledgerNoId" = "bLedgerTransactions"."ledgerID"
  LEFT JOIN "bcAccountType_Ext" ON "bLedger"."accountTypeID" = "bcAccountType_Ext"."accountType_Ext"
  WHERE "bLedgerTransactions"."dateTime"  >=$1

UNION

SELECT id, "bLedger"."ledgerNo", "bcAccountType_Ext"."xActTypeCode",  "ledgerID_Debit", "dateTime", amount, "ledgerID", 
2 as "codeTransaction", "XactTypeCode_Ext", "entryDetails", "extTransactionId"
	FROM public."bLedgerTransactions"
	  LEFT JOIN "bLedger" ON "bLedger"."ledgerNoId" = "bLedgerTransactions"."ledgerID_Debit"
  LEFT JOIN "bcAccountType_Ext" ON "bLedger"."accountTypeID" = "bcAccountType_Ext"."accountType_Ext"
  WHERE "bLedgerTransactions"."dateTime"  >=$1
  ORDER by	1
$BODY$;

ALTER FUNCTION public.f_all_ledger_transactions_from_date(date)
    OWNER TO postgres;
