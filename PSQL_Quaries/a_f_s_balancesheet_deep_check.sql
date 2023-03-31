-- FUNCTION: public.f_s_balancesheet_deep_check(date, date)

DROP FUNCTION IF EXISTS public.f_s_balancesheet_deep_check(date, date);

CREATE OR REPLACE FUNCTION public.f_s_balancesheet_deep_check(
	datebalancetocheck date,
	firstdayofcalculation date)
    RETURNS TABLE("accountNo" text, "accountId" real, "accountType" text, "datePreviousBalance" date, "dateBalance" date, "openingBalance" real, 
				  "totalCredit" real, "totalDebit" real, "OutGoingBalance" real, "checkClosing" numeric, xacttypecode numeric) 
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
SELECT  "accountNo", "accountId", "accountType", "datePreviousBalance" , COALESCE("dateBalance"::date ,$2::date) AS "dateBalance" , 
    "openingBalance"::numeric, 	"totalDebit", "totalCredit", "OutGoingBalance", "checkClosing", "xacttypecode" 
	FROM f_s_balancesheet_all()
	where "dateBalance"::date = $1::date
UNION
SELECT COALESCE(f_s_balancesheet_all."accountNo",turnovers."accountNo") AS "accountNo", 
     COALESCE(f_s_balancesheet_all."accountId", turnovers."accountId") AS "accountId", 
	 'Entries' AS "accountType",
     COALESCE(f_s_balancesheet_all."datePreviousBalance", $2::date) AS  "datePreviousBalance",
	 COALESCE(f_s_balancesheet_all."dateBalance", $2::date) AS "dateBalance",
	 COALESCE( f_s_balancesheet_all."openingBalance", 0)::numeric AS "openingBalance",
	 COALESCE(turnovers."totalDebit",0), COALESCE(turnovers."totalCredit",0), 
	 COALESCE(turnovers."outBalance", f_s_balancesheet_all."openingBalance"), 0, f_s_balancesheet_all."xacttypecode" 
FROM (SELECT  f_s_balancesheet_all."accountNo", f_s_balancesheet_all."accountId", f_s_balancesheet_all."accountType", 
	  f_s_balancesheet_all."datePreviousBalance" ,f_s_balancesheet_all."dateBalance" , f_s_balancesheet_all."openingBalance",f_s_balancesheet_all."xacttypecode"  
	  FROM f_s_balancesheet_all()
	  WHERE f_s_balancesheet_all."dateBalance"::date = $2::date
	  ) AS f_s_balancesheet_all
	FULL OUTER JOIN (
		SELECT "accountNo", "accountId", 'Entries' AS "accountType", null AS "datePreviousBalance",
		 '2050-01-01' AS "dateBalance",
		MAX ("openingBalance") AS "openingBalance",  
		SUM ("totalDebit") AS "totalDebit" , SUM ("totalCredit") AS "totalCredit",
		COALESCE(MAX("openingBalance") + 
		  SUM("signedTurnOver") FILTER (WHERE "dataTime"::date !=$2::date), MAX ("openingBalance")) as "outBalance", 0,"xActTypeCode"
		 FROM public.f_bcurrentturnoversandbalncesnotclosed($2::date) 
		where "dataTime"::date <=$1::date
		group by "accountId", "accountNo", "xActTypeCode"
		UNION
		SELECT "accountNo", "accountId", 'Entries' AS "accountType", null AS "datePreviousBalance",
		 '2050-01-01' AS "dateBalance",
		MAX ("openingBalance") AS "openingBalance",  
		SUM ("totalDebit") AS "totalDebit" , SUM ("totalCredit") AS "totalCredit",
		COALESCE (MAX("openingBalance") + 
		SUM("signedTurnOver") FILTER (WHERE "dataTime"::date !=$2::date),MAX ("openingBalance")) as "outBalance", 0,"xActTypeCode"
		 FROM public.f_bcurrent_ledger_turnovers_balances_notclosed($2::date) 
		where "dataTime"::date <=$1::date
		group by "accountId", "accountNo", "xActTypeCode"
	) as turnovers
	ON f_s_balancesheet_all."accountNo" = turnovers."accountNo"

ORDER by "dateBalance", "accountNo"
$BODY$;

ALTER FUNCTION public.f_s_balancesheet_deep_check(date, date)
    OWNER TO postgres;
