-- FUNCTION: public.f_a_b_positions_current_turnovers_not_closed_by_date(date)

-- DROP FUNCTION IF EXISTS public.f_a_b_positions_current_turnovers_not_closed_by_date(date);

CREATE OR REPLACE FUNCTION public.f_a_b_positions_current_turnovers_not_closed_by_date(
	p_postion_date date)
    RETURNS TABLE("accountId" numeric, "accountNo" text, signed_turnover numeric) 
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
 
SELECT
  "bAccounts"."accountId",
  "bAccounts"."accountNo",
  SUM(
    CASE (
        "bAccountTransaction"."XactTypeCode" + "bcAccountType_Ext"."xActTypeCode"
      )
      WHEN 3 THEN "amountTransaction"
      ELSE "amountTransaction" * -1
    END
  ) AS sign_amount
FROM
  "bAccountTransaction"
  LEFT JOIN "bAccounts" ON "bAccounts"."accountId" = "bAccountTransaction"."accountId"
  LEFT JOIN "bcAccountType_Ext" ON "bcAccountType_Ext"."accountType_Ext" = "bAccounts"."accountTypeExt"
WHERE
  "dataTime" > (
    SELECT
      "FirstOpenedDate"
    FROM
      "gAppMainParams"
  )
GROUP BY
  "bAccounts"."accountId";

$BODY$;

ALTER FUNCTION public.f_a_b_positions_current_turnovers_not_closed_by_date(date)
    OWNER TO postgres;
