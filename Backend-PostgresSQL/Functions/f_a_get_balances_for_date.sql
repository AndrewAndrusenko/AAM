-- FUNCTION: public.f_i_get_npv_dynamic(text[], date, date, numeric)

DROP FUNCTION IF EXISTS public.f_a_get_balances_for_date(text[], date);

CREATE OR REPLACE FUNCTION public.f_a_get_balances_for_date(
	p_portfolios_list text[],
	p_report_date date)
    RETURNS TABLE(
		balance_date date,
		current_balance numeric,
		account_id bigint,
		account_no char varying,
		idportfolio int,
		portfolioname char varying,
		currency_code numeric
	) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN query
WITH
  accounts_data AS (
    SELECT
      "bAccounts"."accountNo" AS account_no,
      "bAccounts"."accountId" AS account_id,
      dportfolios.idportfolio,
      dportfolios.portfolioname,
      "bAccounts"."currencyCode" AS currency_code
    FROM
      "bAccounts"
      LEFT JOIN dportfolios ON dportfolios.idportfolio = "bAccounts".idportfolio
    WHERE
      dportfolios.portfolioname = ANY (p_portfolios_list)
      AND "bAccounts"."accountTypeExt" = 8
  ),
  turnovers_not_closed_accounting AS (
    SELECT
      "bAccountTransaction"."accountId" AS account_id,
      SUM("bAccountTransaction"."amountTransaction") FILTER (
        WHERE
          "bAccountTransaction"."XactTypeCode" = 1
      ) AS "totalCredit",
      SUM("bAccountTransaction"."amountTransaction") FILTER (
        WHERE
          "bAccountTransaction"."XactTypeCode" = 2
      ) AS "totalDebit"
    FROM
      "bAccountTransaction"
    WHERE
      "bAccountTransaction"."accountId" = ANY (SELECT accounts_data.account_id FROM accounts_data)
      AND "bAccountTransaction"."dataTime" <= p_report_date
      AND "bAccountTransaction"."dataTime" >= (SELECT "FirstOpenedDate" FROM public."gAppMainParams")
    GROUP BY
      "bAccountTransaction"."accountId"
  )
SELECT
  p_report_date AS balance_date,
  (
    COALESCE(accounts_statements_data."closingBalance", 0) + 
	COALESCE(turnovers_not_closed_accounting."totalCredit", 0) - 
	COALESCE(turnovers_not_closed_accounting."totalDebit", 0)
  ) AS current_balance,
  accounts_data.account_id,
  accounts_data.account_no,
  accounts_data.idportfolio,
  accounts_data.portfolioname,
  accounts_data.currency_code
FROM
  accounts_data
  LEFT JOIN turnovers_not_closed_accounting USING (account_id)
  LEFT JOIN LATERAL (
    SELECT
      "closingBalance","totalCredit","totalDebit"
    FROM
      "bAccountStatement"
    WHERE
      "bAccountStatement"."accountId" = accounts_data.account_id
	  AND "bAccountStatement"."dateAcc" <=p_report_date
    ORDER BY "bAccountStatement"."dateAcc" DESC
    LIMIT 1
  ) AS accounts_statements_data ON TRUE;
END;
$BODY$;

ALTER FUNCTION public.f_a_get_balances_for_date(text[], date)
    OWNER TO postgres;
select * from f_a_get_balances_for_date(array['ACM002','VPC004'],'10/31/2023')