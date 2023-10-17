-- FUNCTION: public.f_a_b_positions_current_turnovers_not_closed_by_date(bigint[], date)

DROP FUNCTION IF EXISTS public.f_a_b_positions_current_turnovers_not_closed_by_date(bigint[], date);

CREATE OR REPLACE FUNCTION public.f_a_b_positions_current_turnovers_not_closed_by_date(
	p_idportfolios bigint[],
	p_postion_date date)
    RETURNS TABLE( idportfolio int, portfolioname char varying,"accountId" bigint, 
				  "accountNo" character varying, account_currency numeric, signed_turnover numeric,
				   instrument  character varying,positon_type text) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
DECLARE 
last_closed_accounting_date date;
BEGIN
SELECT "FirstOpenedDate" INTO last_closed_accounting_date FROM "gAppMainParams";
IF last_closed_accounting_date::date>p_postion_date::date THEN 
RETURN;
ELSE
RETURN QUERY
SELECT
 dportfolios.idportfolio,
  dportfolios.portfolioname,
  "bAccounts"."accountId",
  "bAccounts"."accountNo",
  "bAccounts"."currencyCode" as account_currency,
  SUM(
    CASE (
        "bAccountTransaction"."XactTypeCode" + "bcAccountType_Ext"."xActTypeCode"
      )
      WHEN 3 THEN "amountTransaction"
      ELSE "amountTransaction" * -1
    END
  ) AS sign_amount,
  CASE
	WHEN "bAccounts".secid NOTNULL THEN "bAccounts".secid
	ELSE 'money'
  END AS "instrument",
	CASE
	WHEN "bAccounts".secid NOTNULL THEN 'investment'
	ELSE 'money'
  END AS "positon_type"
FROM
  "bAccountTransaction"
  LEFT JOIN "bAccounts" ON "bAccounts"."accountId" = "bAccountTransaction"."accountId"
  LEFT JOIN dportfolios ON dportfolios.idportfolio = "bAccounts".idportfolio
  LEFT JOIN "bcAccountType_Ext" ON "bcAccountType_Ext"."accountType_Ext" = "bAccounts"."accountTypeExt"
WHERE
  dportfolios.idportfolio = ANY (p_idportfolios) 
  AND ("dataTime" >last_closed_accounting_date  AND  "dataTime"<=p_postion_date)
GROUP BY
  "bAccounts"."accountId","currencyCode",dportfolios.idportfolio, dportfolios.portfolioname;
  END IF;
END;
$BODY$;

ALTER FUNCTION public.f_a_b_positions_current_turnovers_not_closed_by_date(bigint[], date)
    OWNER TO postgres;
