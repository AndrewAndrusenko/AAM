INSERT INTO public."bAccountStatement" ("accountId", "dateAcc",  "totalCredit", "totalDebit", "closingBalance")
	(SELECT "bAccountTransaction"."accountId", "dataTime", 
CAST(SUM("amountTransaction") FILTER (WHERE "XactTypeCode" = 1) AS MONEY) AS "totalCredit",
CAST(SUM("amountTransaction") FILTER (WHERE "XactTypeCode" = 2) AS MONEY) AS "totalDebit",
CAST(SUM ( 
	CASE "XactTypeCode"
	WHEN 1 THEN "amountTransaction"
    WHEN 2 THEN "amountTransaction"*-1
    END ) + "bAccountStatement"."closingBalance"*10000 AS MONEY)  AS "Net"
	FROM public."bAccountTransaction" 
	LEFT JOIN "bAccountStatement" ON "bAccountTransaction"."accountId" = "bAccountStatement"."accountId"
	WHERE (("bAccountStatement"."dateAcc" + '1 day'::interval)::date = "dataTime"::date)
	GROUP BY "bAccountTransaction"."accountId", "dataTime", "bAccountStatement"."closingBalance")