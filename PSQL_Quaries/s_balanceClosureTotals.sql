deallocate BalanceSheet;
PREPARE BalanceSheet (date) AS
SELECT "bAccountTransaction"."accountId", "dataTime", "bAccountStatement"."closingBalance" AS "IncomingBalane",
CAST(SUM("amountTransaction") FILTER (WHERE "XactTypeCode" = 1) AS MONEY) AS "totalCredit",
CAST(SUM("amountTransaction") FILTER (WHERE "XactTypeCode" = 2) AS MONEY) AS "totalDebit",
CAST(SUM ( 
	CASE "XactTypeCode"
	WHEN 1 THEN "amountTransaction"
    WHEN 2 THEN "amountTransaction"*-1
    END ) + "bAccountStatement"."closingBalance" AS MONEY)  AS "OutGoingBalance"
	FROM public."bAccountTransaction" 
	LEFT JOIN "bAccountStatement" ON "bAccountTransaction"."accountId" = "bAccountStatement"."accountId"
-- 	WHERE (("dataTime"::date = '2023-02-19'::date) AND (("bAccountStatement"."dateAcc" + '1 day'::interval)::date ='2023-02-19' ::date))
	WHERE (("dataTime"::date = $1::date) AND (("bAccountStatement"."dateAcc" + '1 day'::interval)::date =$1 ::date))

GROUP BY "bAccountTransaction"."accountId", "dataTime", "bAccountStatement"."closingBalance";

EXECUTE BalanceSheet('2023-02-19');