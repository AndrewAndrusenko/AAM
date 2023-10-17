-- FUNCTION: public.f_i_portfolios_balances_by_account_for_idportfolios(bigint[], date)

DROP FUNCTION IF EXISTS public.f_i_portfolios_balances_by_account_for_idportfolios(bigint[], date);

CREATE OR REPLACE FUNCTION public.f_i_portfolios_balances_by_account_for_idportfolios(
	p_idportfolios bigint[],
	p_report_date date)
    RETURNS TABLE(idportfolio integer, "accountNo" character varying, portfolioname character varying, 
				  instrument character varying, positon_type text, last_closed_day_with_transactions date,  last_closed_balance numeric,
				  signed_turnover numeric, current_balance numeric, account_currency numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$

BEGIN

RETURN QUERY
WITH current_balances AS (
	SELECT
	  dportfolios.idportfolio,
	  "bAccounts"."accountNo",
	  "bAccounts"."accountId",
	  dportfolios.portfolioname,
	  "bAccountStatement"."closingBalance" as last_closed_balance,
	  CASE
		WHEN "bAccounts".secid NOTNULL THEN "bAccounts".secid
		ELSE 'money'
	  END AS "instrument",
		CASE
		WHEN "bAccounts".secid NOTNULL THEN 'investment'
		ELSE 'money'
	  END AS "positon_type",
	  "bAccountStatement"."dateAcc" AS last_closed_day_with_transactions,
	  "bAccounts"."currencyCode" as account_currency
	FROM
	  "bAccounts"
	  LEFT JOIN (
		SELECT DISTINCT
		  ON ("accountId") "accountId",
		  "closingBalance",
		  "dateAcc"
		FROM
		  "bAccountStatement"
		ORDER BY
		  "accountId",
		  "dateAcc" DESC
	  ) "bAccountStatement" ON "bAccounts"."accountId" = "bAccountStatement"."accountId"
	  LEFT JOIN dportfolios ON dportfolios.idportfolio = "bAccounts".idportfolio

	WHERE
	  "bAccounts"."accountTypeExt" != 13
	  AND "dportfolios".idportfolio = ANY (p_idportfolios)
	  AND "dateAcc" <=p_report_date
)
SELECT 
  COALESCE(current_balances.idportfolio,turnovers.idportfolio) as idportfolio,
  COALESCE(current_balances."accountNo",turnovers."accountNo") as "accountNo",
  COALESCE(current_balances.portfolioname,turnovers.portfolioname ) as portfolioname,
  COALESCE(current_balances.instrument,turnovers.instrument),
  COALESCE(current_balances.positon_type,turnovers.positon_type) as positon_type,
  current_balances.last_closed_day_with_transactions, 
  COALESCE(current_balances.last_closed_balance,0) as last_closed_balance,
  COALESCE(turnovers.signed_turnover,0) as signed_turnover,
  COALESCE(turnovers.signed_turnover, 0) + COALESCE(current_balances.last_closed_balance, 0) AS current_balance,
  COALESCE (current_balances.account_currency,turnovers.account_currency) as account_currency
FROM current_balances
FULL JOIN (
    SELECT * FROM f_a_b_positions_current_turnovers_not_closed_by_date (p_idportfolios,p_report_date)
  ) AS turnovers ON turnovers."accountId" = current_balances."accountId";
END
$BODY$;

ALTER FUNCTION public.f_i_portfolios_balances_by_account_for_idportfolios(bigint[], date)
    OWNER TO postgres;
