-- FUNCTION: public.f_a_b_get_all_entries_transactions(date, date, numeric[], text[], text[], numeric, numeric[], numeric)

DROP FUNCTION IF EXISTS public.f_a_b_get_all_entries_transactions(daterange, numeric[], text[], text[], numeric, numeric[], numeric);

CREATE OR REPLACE FUNCTION public.f_a_b_get_all_entries_transactions(
	p_range_date daterange,
	p_entry_types numeric[],
	p_portfolio_code text[],
	p_account text[],
	p_idtrade numeric,
	entriesids numeric[],
	p_external_id numeric)
    RETURNS TABLE(d_portfolioname character varying, idportfolio bigint, "d_transactionType" text, t_id bigint, "t_entryDetails" character varying, "t_ledgerNoId" bigint, "t_accountId" bigint, "t_dataTime" timestamp without time zone, "t_extTransactionId" bigint, t_idtrade numeric, "t_amountTransaction" numeric, "t_XactTypeCode" bigint, "t_XactTypeCode_Ext" bigint, "d_entryDetails" text, "d_Debit" character varying, "d_Credit" character varying, "d_ledgerNo" character varying, "d_accountNo" character varying, "d_xActTypeCodeExtName" character, d_manual_edit_forbidden boolean) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN query
WITH account_entries AS (
	SELECT
	  "bAccounts".idportfolio,
	  'AL' AS "d_transactionType",
	  "bAccountTransaction".id AS "t_id",
	  "entryDetails" AS "t_entryDetails",
	  "bAccountTransaction"."ledgerNoId" AS "t_ledgerNoId",
	  "bAccountTransaction"."accountId" AS "t_accountId",
	  "dataTime"::TIMESTAMP WITHOUT TIME ZONE AS "t_dataTime",
	  "extTransactionId" AS "t_extTransactionId",
	  idtrade AS t_idtrade,
	  "amountTransaction" AS "t_amountTransaction",
	  "XactTypeCode" AS "t_XactTypeCode",
	  "bAccountTransaction"."XactTypeCode_Ext" AS "t_XactTypeCode_Ext",
	  "bcTransactionType_Ext"."description" || ': ' || "bAccountTransaction"."entryDetails" AS "d_entryDetails",
	  CASE "bAccountTransaction"."XactTypeCode"
		WHEN 1 THEN "bLedger"."ledgerNo"
		WHEN 2 THEN "bAccounts"."accountNo"
	  END AS "d_Debit",
	  CASE "bAccountTransaction"."XactTypeCode"
		WHEN 2 THEN "bLedger"."ledgerNo"
		WHEN 1 THEN "bAccounts"."accountNo"
	  END AS "d_Credit",
	  "ledgerNo" AS "d_ledgerNo",
	  "bAccounts"."accountNo" AS "d_accountNo",
	  "bcTransactionType_Ext"."xActTypeCode_Ext" AS "d_xActTypeCodeExtName",
	  "bcTransactionType_Ext".manual_edit_forbidden as d_manual_edit_forbidden
	FROM
	  "bAccountTransaction"
	  LEFT JOIN "bcTransactionType_Ext" ON "bAccountTransaction"."XactTypeCode_Ext" = "bcTransactionType_Ext".id
	  LEFT JOIN "bAccounts" ON "bAccounts"."accountId" = "bAccountTransaction"."accountId"
	  LEFT JOIN "bLedger" ON "bLedger"."ledgerNoId" = "bAccountTransaction"."ledgerNoId"
	  WHERE (p_range_date ISNULL OR p_range_date @> "dataTime"::date)
		AND (p_idtrade ISNULL OR  "bAccountTransaction".idtrade = p_idtrade)
		AND (p_external_id ISNULL OR  "bAccountTransaction"."extTransactionId" = p_external_id)
		AND (p_entry_types ISNULL OR  "bAccountTransaction"."XactTypeCode_Ext" =ANY(p_entry_types))
		AND (entriesIds ISNULL OR  "bAccountTransaction"."id" =ANY(entriesIds))
		AND (p_account ISNULL OR (
			"bAccounts"."accountNo" = ANY(p_account) OR "bLedger"."ledgerNo" = ANY(p_account)
		))
), ledger_transactions AS (
	SELECT
	   0 as idportfolio,
	  'LL' AS "d_transactionType",
	  "bLedgerTransactions".id AS "t_id",
	  "entryDetails" AS "t_entryDetails",
	  "bLedgerTransactions"."ledgerID_Debit" AS "t_ledgerNoId",
	  "bLedgerTransactions"."ledgerID" AS "t_accountId",
	  "dateTime"::TIMESTAMP WITHOUT TIME ZONE AS "t_dataTime",
	  "extTransactionId" AS "t_extTransactionId",
	  idtrade AS t_idtrade,
	  "amount" AS "t_amountTransaction",
	  0 AS "t_XactTypeCode",
	  "bLedgerTransactions"."XactTypeCode_Ext" AS "t_XactTypeCode_Ext",
	  "bcTransactionType_Ext"."description" || ': ' || "bLedgerTransactions"."entryDetails" AS "d_entryDetails",
	  "bLedgerDebit"."ledgerNo" AS "d_Debit",
	  "bLedger"."ledgerNo" AS "d_Credit",
	  "bLedgerDebit"."ledgerNo" AS "d_ledgerNo",
	  "bLedger"."ledgerNo" AS "d_accountNo",
	  "bcTransactionType_Ext"."xActTypeCode_Ext" AS "d_xActTypeCodeExtName",
	  "bcTransactionType_Ext".manual_edit_forbidden as d_manual_edit_forbidden
	FROM
	  "bLedgerTransactions"
	  LEFT JOIN "bcTransactionType_Ext" ON "bLedgerTransactions"."XactTypeCode_Ext" = "bcTransactionType_Ext".id
	  LEFT JOIN "bLedger" ON "bLedger"."ledgerNoId" = "bLedgerTransactions"."ledgerID"
	  LEFT JOIN "bLedger" AS "bLedgerDebit" ON "bLedgerDebit"."ledgerNoId" = "bLedgerTransactions"."ledgerID_Debit"
	  WHERE (p_range_date ISNULL OR   p_range_date @> "dateTime"::date)
		AND (p_idtrade ISNULL OR "bLedgerTransactions".idtrade = p_idtrade)
		AND (p_external_id ISNULL OR  "bLedgerTransactions"."extTransactionId" = p_external_id)
		AND (p_entry_types ISNULL OR  "bLedgerTransactions"."XactTypeCode_Ext" =ANY(p_entry_types))
		AND (entriesIds ISNULL OR  "bLedgerTransactions"."id" =ANY(entriesIds))
		AND (p_account ISNULL OR (
			"bLedger"."ledgerNo" = ANY(p_account) OR "bLedgerDebit"."ledgerNo" = ANY(p_account)
		))
), entries AS (
	SELECT * FROM account_entries
	UNION
	SELECT * FROM ledger_transactions
)
select
        dportfolios.portfolioname AS d_portfolioname,
		entries.idportfolio ,
		entries."d_transactionType" ,
		entries."t_id" ,
		entries."t_entryDetails",
		entries."t_ledgerNoId" ,
		entries."t_accountId" ,
		entries."t_dataTime"  ,
		entries."t_extTransactionId" ,
		entries.t_idtrade ,
		entries."t_amountTransaction" ,
		entries."t_XactTypeCode" ,
		entries."t_XactTypeCode_Ext" ,
		entries."d_entryDetails" ,
		entries."d_Debit",
		entries."d_Credit",
		entries."d_ledgerNo",
		entries."d_accountNo",
		entries."d_xActTypeCodeExtName",
		entries.d_manual_edit_forbidden
FROM entries 
LEFT JOIN dportfolios ON entries.idportfolio=dportfolios.idportfolio
WHERE (p_portfolio_code ISNULL OR  dportfolios.portfolioname =ANY(p_portfolio_code))
ORDER BY entries."t_dataTime" DESC,entries."t_amountTransaction" DESC;
END;
$BODY$;

ALTER FUNCTION public.f_a_b_get_all_entries_transactions(daterange, numeric[], text[], text[], numeric, numeric[], numeric)
    OWNER TO postgres;
