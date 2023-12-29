-- FUNCTION: public.f_a_b_balancesheet_total_closed_and_notclosed()

DROP FUNCTION IF EXISTS public.f_a_b_balancesheet_total_closed_and_notclosed();

CREATE OR REPLACE FUNCTION public.f_a_b_balancesheet_total_closed_and_notclosed(
	)
    RETURNS TABLE(
		portfolioname character varying, secid character varying, 
		"accountNo" text, "accountId" numeric, "accountType" text, 
		"datePreviousBalance" date, "dateBalance" timestamp without time zone, 
		"openingBalance" numeric, "totalDebit" numeric, "totalCredit" numeric, "OutGoingBalance" numeric, 
		"checkClosing" numeric, xacttypecode integer, currencycode numeric, "dateOpening" date
	 ) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
DECLARE
first_opened_date date;
BEGIN
SELECT "FirstOpenedDate" INTO first_opened_date FROM public."gAppMainParams";
RETURN query
WITH balances AS (
	SELECT
	  f_a_b_balances_closed_all."accountNo",
	  f_a_b_balances_closed_all."accountId",
	  f_a_b_balances_closed_all."accountType",
	  f_a_b_balances_closed_all."datePreviousBalance",
	  f_a_b_balances_closed_all."dateBalance"::TIMESTAMP WITHOUT TIME ZONE,
	  f_a_b_balances_closed_all."openingBalance",
	  f_a_b_balances_closed_all."totalDebit",
	  f_a_b_balances_closed_all."totalCredit",
	  f_a_b_balances_closed_all."OutGoingBalance",
	  f_a_b_balances_closed_all."checkClosing",
	  f_a_b_balances_closed_all."xacttypecode"
	FROM
	  f_a_b_balances_closed_all ()
	UNION
	SELECT
	  f_a_b_current_turnovers_and_balnces_not_closed."accountNo",
	  f_a_b_current_turnovers_and_balnces_not_closed."accountId",
	  'Account',
	  null,
	  f_a_b_current_turnovers_and_balnces_not_closed."dataTime"::TIMESTAMP WITHOUT TIME ZONE,
	  f_a_b_current_turnovers_and_balnces_not_closed."corrOpeningBalance",
	  f_a_b_current_turnovers_and_balnces_not_closed."totalDebit",
	  f_a_b_current_turnovers_and_balnces_not_closed."totalCredit",
	  "corrOpeningBalance" + "signedTurnOver" AS "OutGoingBalance",
	  0,
	  f_a_b_current_turnovers_and_balnces_not_closed."xActTypeCode"
	FROM
	  f_a_b_current_turnovers_and_balnces_not_closed (first_opened_date)
	UNION
	SELECT
	  f_a_b_bcurrent_ledger_turnovers_balances_notclosed."accountNo",
	  f_a_b_bcurrent_ledger_turnovers_balances_notclosed."accountId",
	  'Ledger',
	  null,
	  f_a_b_bcurrent_ledger_turnovers_balances_notclosed."dataTime"::TIMESTAMP WITHOUT TIME ZONE,
	  f_a_b_bcurrent_ledger_turnovers_balances_notclosed. "corrOpeningBalance",
	  f_a_b_bcurrent_ledger_turnovers_balances_notclosed."totalDebit",
	  f_a_b_bcurrent_ledger_turnovers_balances_notclosed."totalCredit",
	  ("corrOpeningBalance" + "signedTurnOver") AS "OutGoingBalance",
	  0,
	  f_a_b_bcurrent_ledger_turnovers_balances_notclosed."xActTypeCode"
	FROM
	  f_a_b_bcurrent_ledger_turnovers_balances_notclosed (first_opened_date)
)
SELECT dportfolios.portfolioname, 	  
	  "bAccounts".secid,
	  balances."accountNo",
	  balances."accountId",
	  balances."accountType",
	  balances."datePreviousBalance",
	  balances."dateBalance"::TIMESTAMP WITHOUT TIME ZONE,
	  balances."openingBalance",
	  balances."totalDebit",
	  balances."totalCredit",
	  balances."OutGoingBalance",
	  balances."checkClosing",
	  balances."xacttypecode",
	  "bAccounts"."currencyCode",
	  "bAccounts"."dateOpening"
FROM balances
LEFT JOIN "bAccounts" ON balances."accountId"= "bAccounts"."accountId"
LEFT JOIN dportfolios ON (dportfolios.idportfolio= "bAccounts".idportfolio AND balances."accountType"='Account')
ORDER BY
  balances."dateBalance"::TIMESTAMP WITHOUT TIME ZONE DESC;
END;
$BODY$;

ALTER FUNCTION public.f_a_b_balancesheet_total_closed_and_notclosed()
    OWNER TO postgres;
