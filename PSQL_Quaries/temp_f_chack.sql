-- FUNCTION: public.f_s_balancesheet_deep_check(date, date)

-- DROP FUNCTION IF EXISTS public.f_s_balancesheet_deep_check(date, date);

CREATE OR REPLACE FUNCTION public.f_s_balancesheet_deep_check(
	datebalancetocheck date,
	firstdayofcalculation date)
    RETURNS TABLE("accountNo" text, "accountId" integer, "accountType" text, "datePreviousBalance" date, "dateBalance" date, "openingBalance" numeric, "totalCredit" numeric, "totalDebit" numeric, "OutGoingBalance" numeric, "checkClosing" numeric, xacttypecode numeric) 
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
SELECT  "accountNo", "accountId", "accountType", "datePreviousBalance" ,"dateBalance" , "openingBalance", 
	"totalDebit", "totalCredit", "OutGoingBalance", "checkClosing", "xacttypecode" 
	FROM f_s_balancesheet_all()
	where "dateBalance"::date = $1::date
UNION
SELECT  "accountNo", "accountId", "accountType", "datePreviousBalance" ,"dateBalance" , "openingBalance", 
	"totalDebit", "totalCredit", "OutGoingBalance", "checkClosing", "xacttypecode" 
	FROM f_s_balancesheet_all()
	INNER JOIN (
		SELECT "accountNo", "accountId", 'Account' AS "accountType", null AS "datePreviousBalance",
		 '2050-01-01' AS "dateBalance",
		MAX ("openingBalance") AS "openingBalance",  
		SUM ("totalDebit") AS "totalDebit" , SUM ("totalCredit") AS "totalCredit",
		COALESCE(MAX("openingBalance") + 
		  SUM("signedTurnOver") FILTER (WHERE "dataTime"::date !=$2::date), MAX ("openingBalance")) as "outBalance", 0,"xActTypeCode"
		 FROM public.f_bcurrentturnoversandbalncesnotclosed($2::date) 
		where "dataTime"::date <=$1::date
		group by "accountId", "accountNo", "xActTypeCode"
		UNION
		SELECT "accountNo", "accountId", 'Leger' AS "accountType", null AS "datePreviousBalance",
		 '2050-01-01' AS "dateBalance",
		MAX ("openingBalance") AS "openingBalance",  
		SUM ("totalDebit") AS "totalDebit" , SUM ("totalCredit") AS "totalCredit",
		COALESCE (MAX("openingBalance") + 
		SUM("signedTurnOver") FILTER (WHERE "dataTime"::date !=$2::date),MAX ("openingBalance")) as "outBalance", 0,"xActTypeCode"
		 FROM public.f_bcurrent_ledger_turnovers_balances_notclosed($2::date) 
		where "dataTime"::date <=$1::date
		group by "accountId", "accountNo", "xActTypeCode"
	) as turnovers
	ON f_s_balancesheet_all."accountId" = turnovers."accountId"
WHERE "dateBalance"::date = $2::date
ORDER by "dateBalance", "accountNo"
$BODY$;

ALTER FUNCTION public.f_s_balancesheet_deep_check(date, date)
    OWNER TO postgres;
