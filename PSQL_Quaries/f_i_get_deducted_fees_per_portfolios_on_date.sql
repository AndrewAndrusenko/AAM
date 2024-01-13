-- FUNCTION: public.f_i_get_deposits_withdrawals_per_portfolios_on_date(text[], date)

DROP FUNCTION IF EXISTS public.f_i_get_deducted_fees_per_portfolios_on_date(text[], date);

CREATE OR REPLACE FUNCTION public.f_i_get_deducted_fees_per_portfolios_on_date(
	p_portfolios_list text[],
	p_report_date date)
    RETURNS TABLE(idportfolio int,portfolioname character varying,transaction_type bigint, "dataTime" date, "accountNo" character varying, fee_amount numeric, account_currency numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN QUERY
  SELECT
	dportfolios.idportfolio,
    dportfolios.portfolioname,
	"bAccountTransaction"."XactTypeCode_Ext" as transaction_type,
     "bAccountTransaction"."dataTime"::date ,
    "bAccounts"."accountNo",
    SUM(
      CASE
        WHEN "XactTypeCode_Ext" = 14 THEN "amountTransaction" * -1
		ELSE "amountTransaction"
      END
    ) AS fee_amount,
  "bAccounts"."currencyCode" as account_currency
  FROM
    "bAccountTransaction"
    LEFT JOIN "bAccounts" ON "bAccounts"."accountId" = "bAccountTransaction"."accountId"
    LEFT JOIN dportfolios ON "bAccounts".idportfolio = dportfolios.idportfolio
  WHERE
    LOWER(dportfolios.portfolioname) = ANY (p_portfolios_list)
    AND "XactTypeCode_Ext" = ANY (ARRAY[14])
    AND  "bAccountTransaction"."dataTime" <= p_report_date
  GROUP BY
    GROUPING SETS (
      (
		 dportfolios.idportfolio,
        dportfolios.portfolioname,
        "bAccountTransaction"."dataTime",
        "bAccounts"."accountNo",
		"currencyCode"
      ),
      (
	   dportfolios.idportfolio,
	   dportfolios.portfolioname,
	   "bAccountTransaction"."XactTypeCode_Ext",
	  "currencyCode"),
      ()
    );
END;
$BODY$;

ALTER FUNCTION public.f_i_get_deducted_fees_per_portfolios_on_date(text[], date)
    OWNER TO postgres;
select * from f_i_get_deducted_fees_per_portfolios_on_date(array['icm011','acm002'],'09/30/2023')