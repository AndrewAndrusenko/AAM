-- FUNCTION: public.f_a_b_balancesheet_deep_check(date, date)

-- DROP FUNCTION IF EXISTS public.f_a_b_balancesheet_deep_check(date, date);

CREATE OR REPLACE FUNCTION public.f_a_b_balancesheet_deep_check(
	datebalancetocheck date,
	firstdayofcalculation date)
    RETURNS TABLE("accountNo" text, "accountId" real, "accountType" text, "datePreviousBalance" date, "dateBalance" date, "openingBalance" real, "totalCredit" real, "totalDebit" real, "OutGoingBalance" real, "checkClosing" numeric, xacttypecode numeric) 
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
SELECT  "accountNo", "accountId", "accountType", "datePreviousBalance" , COALESCE("dateBalance"::date ,$2::date) AS "dateBalance" , 
    "openingBalance"::numeric, 	"totalDebit", "totalCredit", "OutGoingBalance", "checkClosing", "xacttypecode" 
	FROM f_a_b_balances_closed_all_v2(daterange(datebalancetocheck,datebalancetocheck,'[]'),null,null)
UNION
SELECT COALESCE(f_a_b_balances_closed_all_v2."accountNo",turnovers."accountNo") AS "accountNo", 
     COALESCE(f_a_b_balances_closed_all_v2."accountId", turnovers."accountId") AS "accountId", 
	 'Entries' AS "accountType",
     COALESCE(f_a_b_balances_closed_all_v2."datePreviousBalance", $2::date) AS  "datePreviousBalance",
	 COALESCE(f_a_b_balances_closed_all_v2."dateBalance", $2::date) AS "dateBalance",
	 COALESCE( f_a_b_balances_closed_all_v2."openingBalance", 0)::numeric AS "openingBalance",
	 COALESCE(turnovers."totalDebit",0), COALESCE(turnovers."totalCredit",0), 
	 COALESCE(turnovers."outBalance", f_a_b_balances_closed_all_v2."openingBalance"), 0, f_a_b_balances_closed_all_v2."xacttypecode" 
FROM (SELECT  f_a_b_balances_closed_all_v2."accountNo", f_a_b_balances_closed_all_v2."accountId", f_a_b_balances_closed_all_v2."accountType", 
	  f_a_b_balances_closed_all_v2."datePreviousBalance" ,f_a_b_balances_closed_all_v2."dateBalance" , f_a_b_balances_closed_all_v2."openingBalance",f_a_b_balances_closed_all_v2."xacttypecode"  
	  FROM f_a_b_balances_closed_all_v2(daterange(firstdayofcalculation,firstdayofcalculation,'[]'),null,null)
	  ) AS f_a_b_balances_closed_all_v2
	FULL OUTER JOIN (
		SELECT "accountNo", "accountId", 'Entries' AS "accountType", null AS "datePreviousBalance",
		 '2050-01-01' AS "dateBalance",
		MAX ("openingBalance") AS "openingBalance",  
		SUM ("totalDebit") AS "totalDebit" , SUM ("totalCredit") AS "totalCredit",
		COALESCE(MAX("openingBalance") + 
		  SUM("signedTurnOver") FILTER (WHERE "dataTime"::date !=$2::date), MAX ("openingBalance")) as "outBalance", 0,"xActTypeCode"
		 FROM public.f_a_b_current_turnovers_and_balnces_not_closed_v2($2::date,null,null,null) 
		where "dataTime"::date <=$1::date
		group by "accountId", "accountNo", "xActTypeCode"
		UNION
		SELECT "accountNo", "accountId", 'Entries' AS "accountType", null AS "datePreviousBalance",
		 '2050-01-01' AS "dateBalance",
		MAX ("openingBalance") AS "openingBalance",  
		SUM ("totalDebit") AS "totalDebit" , SUM ("totalCredit") AS "totalCredit",
		COALESCE (MAX("openingBalance") + 
		SUM("signedTurnOver") FILTER (WHERE "dataTime"::date !=$2::date),MAX ("openingBalance")) as "outBalance", 0,"xActTypeCode"
		 FROM public.f_a_b_bcurrent_ledger_turnovers_balances_notclosed_v2($2::date,null,null,null) 
		where "dataTime"::date <=$1::date
		group by "accountId", "accountNo", "xActTypeCode"
	) as turnovers
	ON f_a_b_balances_closed_all_v2."accountNo" = turnovers."accountNo"

ORDER by "dateBalance", "accountNo"
$BODY$;

ALTER FUNCTION public.f_a_b_balancesheet_deep_check(date, date)
    OWNER TO postgres;
