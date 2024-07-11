-- FUNCTION: public.f_i_get_deposits_withdrawals_per_portfolios_on_date(text[], date)

-- DROP FUNCTION IF EXISTS public.f_i_get_deposits_withdrawals_per_portfolios_on_date(text[], date);

CREATE OR REPLACE FUNCTION public.f_i_get_deposits_withdrawals_per_portfolios_on_date(
	p_portfolios_list text[],
	p_report_date date)
    RETURNS TABLE(portfolioname character varying, "dataTime" date, date_first_transaction date, "accountNo" character varying, cash_flow numeric, account_currency numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN QUERY
  SELECT
    dportfolios.portfolioname,
     "bAccountTransaction"."dataTime"::date ,
    MIN( "bAccountTransaction"."dataTime")::date AS date_first_transaction,
    "bAccounts"."accountNo",
    SUM(
      CASE
        WHEN "XactTypeCode_Ext" = 5 THEN "amountTransaction" * -1
        WHEN "XactTypeCode_Ext" = 4 THEN "amountTransaction" * -1
		ELSE "amountTransaction"
      END
    ) AS cash_flow,
  "bAccounts"."currencyCode" as account_currency
  FROM
    "bAccountTransaction"
    LEFT JOIN "bAccounts" ON "bAccounts"."accountId" = "bAccountTransaction"."accountId"
    LEFT JOIN dportfolios ON "bAccounts".idportfolio = dportfolios.idportfolio
  WHERE
    dportfolios.portfolioname = ANY (p_portfolios_list)
    AND "XactTypeCode_Ext" = ANY (ARRAY[3, 5,4])
    AND  "bAccountTransaction"."dataTime" <= p_report_date
  GROUP BY
    GROUPING SETS (
      (
        dportfolios.portfolioname,
         "bAccountTransaction"."dataTime",
        "bAccounts"."accountNo",
		"currencyCode"
      ),
      (dportfolios.portfolioname),
      ()
    );
END;
$BODY$;

ALTER FUNCTION public.f_i_get_deposits_withdrawals_per_portfolios_on_date(text[], date)
    OWNER TO postgres;
