-- FUNCTION: public.f_a_b_balancesheet_total_closed_and_notclosed()

-- DROP FUNCTION IF EXISTS public.f_a_b_balancesheet_total_closed_and_notclosed(daterange, numeric[], text[]);

CREATE OR REPLACE FUNCTION public.f_a_b_balancesheet_total_closed_and_notclosed(
	p_date_balance_range daterange,
	p_account_types numeric[],
	p_accounts_list text[]
	)
    RETURNS TABLE(portfolioname character varying, secid character varying, "accountNo" text, "accountId" numeric, "accountType" text, "datePreviousBalance" date, "dateBalance" timestamp without time zone, "openingBalance" numeric, "totalDebit" numeric, "totalCredit" numeric, "OutGoingBalance" numeric, "checkClosing" numeric, xacttypecode integer, currencycode numeric, "dateOpening" date) 
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
	  f_a_b_balances_closed_all_v2."accountNo",
	  f_a_b_balances_closed_all_v2."accountId",
	  f_a_b_balances_closed_all_v2."accountType",
	  f_a_b_balances_closed_all_v2."datePreviousBalance",
	  f_a_b_balances_closed_all_v2."dateBalance"::TIMESTAMP WITHOUT TIME ZONE,
	  f_a_b_balances_closed_all_v2."openingBalance",
	  f_a_b_balances_closed_all_v2."totalDebit",
	  f_a_b_balances_closed_all_v2."totalCredit",
	  f_a_b_balances_closed_all_v2."OutGoingBalance",
	  f_a_b_balances_closed_all_v2."checkClosing",
	  f_a_b_balances_closed_all_v2."xacttypecode"
	FROM
	  f_a_b_balances_closed_all_v2 (p_date_balance_range,p_account_types,p_accounts_list)
	UNION
	SELECT
	  f_a_b_current_turnovers_and_balnces_not_closed_v2."accountNo",
	  f_a_b_current_turnovers_and_balnces_not_closed_v2."accountId",
	  'Account',
	  null,
	  f_a_b_current_turnovers_and_balnces_not_closed_v2."dataTime"::TIMESTAMP WITHOUT TIME ZONE,
	  f_a_b_current_turnovers_and_balnces_not_closed_v2."corrOpeningBalance",
	  f_a_b_current_turnovers_and_balnces_not_closed_v2."totalDebit",
	  f_a_b_current_turnovers_and_balnces_not_closed_v2."totalCredit",
	  "corrOpeningBalance" + "signedTurnOver" AS "OutGoingBalance",
	  0,
	  f_a_b_current_turnovers_and_balnces_not_closed_v2."xActTypeCode"
	FROM
	  f_a_b_current_turnovers_and_balnces_not_closed_v2 (first_opened_date,p_date_balance_range,p_account_types,p_accounts_list)
	UNION
	SELECT
	  f_a_b_bcurrent_ledger_turnovers_balances_notclosed_v2."accountNo",
	  f_a_b_bcurrent_ledger_turnovers_balances_notclosed_v2."accountId",
	  'Ledger',
	  null,
	  f_a_b_bcurrent_ledger_turnovers_balances_notclosed_v2."dataTime"::TIMESTAMP WITHOUT TIME ZONE,
	  f_a_b_bcurrent_ledger_turnovers_balances_notclosed_v2. "corrOpeningBalance",
	  f_a_b_bcurrent_ledger_turnovers_balances_notclosed_v2."totalDebit",
	  f_a_b_bcurrent_ledger_turnovers_balances_notclosed_v2."totalCredit",
	  ("corrOpeningBalance" + "signedTurnOver") AS "OutGoingBalance",
	  0,
	  f_a_b_bcurrent_ledger_turnovers_balances_notclosed_v2."xActTypeCode"
	FROM
	  f_a_b_bcurrent_ledger_turnovers_balances_notclosed_v2 (first_opened_date,p_date_balance_range,p_account_types,p_accounts_list)
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

ALTER FUNCTION public.f_a_b_balancesheet_total_closed_and_notclosed(daterange, numeric[], text[])
    OWNER TO postgres;
select * from f_a_b_balancesheet_total_closed_and_notclosed(
	'[3/5/2024,3/7/2024]'::daterange,
										  array[8,10],null
-- 										  array['ClearAll', '40820840PANDRW001', '40807840CLIEN3001' ]
)