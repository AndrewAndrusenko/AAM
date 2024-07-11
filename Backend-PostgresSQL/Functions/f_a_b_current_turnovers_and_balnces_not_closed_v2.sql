-- FUNCTION: public.f_a_b_current_turnovers_and_balnces_not_closed(date)

-- DROP FUNCTION IF EXISTS public.f_a_b_current_turnovers_and_balnces_not_closed_v2(date,daterange, numeric[], text[]);

CREATE OR REPLACE FUNCTION public.f_a_b_current_turnovers_and_balnces_not_closed_v2(
	lastclosedbalancedate date,
	p_date_balance_range daterange,
	p_account_types numeric[],
	p_accounts_list text[])
    RETURNS TABLE("accountId" numeric, "accountNo" text, "dataTime" date, "xActTypeCode" integer, "openingBalance" numeric, "corrOpeningBalance" numeric, "signedTurnOver" numeric, "totalCredit" numeric, "totalDebit" numeric) 
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
 
-- Balance sheet for entries within not closed dates. There are no data in table bAccountStatments for these entries
-- View show calculated openingBalance based on the last closed balance and correction as a signed sum of entries from last closed date 
-- till the date of balance sheet row
-- Second view calculate turnovers for the given date. Closing balance for the given date could be calulated using selelct statement from the view
SELECT "bAccountTransaction"."accountId",
  "bAccounts"."accountNo",
   "bAccountTransaction"."dataTime"::date AS "dataTime",
  "bcAccountType_Ext"."xActTypeCode",
  COALESCE("IncomingBalances"."closingBalance", 0) AS "openingBalance",
  COALESCE("IncomingBalances"."closingBalance", 0) + 
  COALESCE(
	(SELECT 
	  SUM(
		CASE tr."XactTypeCode" + "bcAccountType_Ext"."xActTypeCode"
		  WHEN 3 THEN tr."amountTransaction"
		  ELSE tr."amountTransaction" * '-1'::integer::numeric
		END) 
    AS "sCorr"
	FROM "bAccountTransaction" tr
	WHERE 
	  tr."accountId" = "bAccountTransaction"."accountId" AND 
	   tr."dataTime"::date < "bAccountTransaction"."dataTime"::date AND
-- 	  tr."dataTime"::date <=  date_trunc('day',"dataTime")  AND 
	  tr."dataTime"::date >= $1::date), 
  0::numeric) 
  AS "corrOpeningBalance",
  SUM(
	CASE "bAccountTransaction"."XactTypeCode" + "bcAccountType_Ext"."xActTypeCode"
		WHEN 3 THEN "bAccountTransaction"."amountTransaction"
		ELSE "bAccountTransaction"."amountTransaction" * -1
	END) 
	AS "closingBalance",
    COALESCE(sum("bAccountTransaction"."amountTransaction") FILTER (WHERE "bAccountTransaction"."XactTypeCode" = 1), 0) 
	AS "totalCredit",
    COALESCE(sum("bAccountTransaction"."amountTransaction") FILTER (WHERE "bAccountTransaction"."XactTypeCode" = 2), 0) 
	AS "totalDebit"
FROM "bAccountTransaction" "bAccountTransaction"
  LEFT JOIN "bAccounts" ON "bAccounts"."accountId" = "bAccountTransaction"."accountId"
  LEFT JOIN "bcAccountType_Ext" ON "bAccounts"."accountTypeExt" = "bcAccountType_Ext"."accountType_Ext"
  LEFT JOIN 
  (SELECT DISTINCT ON ("bAccountStatement"."accountId") "bAccountStatement"."accountId",
	"bAccountStatement"."dateAcc",
	"bAccountStatement"."closingBalance",
	"bAccountStatement"."totalCredit",
	"bAccountStatement"."totalDebit"
  FROM "bAccountStatement"
  WHERE 
   "bAccountStatement"."dateAcc" <= $1::date
  ORDER BY "bAccountStatement"."accountId", "bAccountStatement"."dateAcc" DESC) "IncomingBalances" 
  ON "bAccountTransaction"."accountId" = "IncomingBalances"."accountId"
WHERE "bAccountTransaction"."dataTime"::date  >= $1::date AND
  (p_date_balance_range ISNULL OR  p_date_balance_range@>"bLedgerStatement"."dateAcc")
  (p_accounts_list ISNULL OR "bLedger"."ledgerNo"=ANY(p_accounts_list)) AND
  (p_account_types ISNULL OR "bLedger"."accountTypeID"=ANY(p_account_types));
GROUP BY "bAccountTransaction"."accountId", "bAccounts"."accountNo",  "bAccountTransaction"."dataTime", "IncomingBalances"."closingBalance", "bcAccountType_Ext"."xActTypeCode"
ORDER BY (date_trunc('day',"dataTime")) DESC;

$BODY$;

ALTER FUNCTION public.f_a_b_current_turnovers_and_balnces_not_closed_v2(date,daterange, numeric[], text[])
    OWNER TO postgres;
