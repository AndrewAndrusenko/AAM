SELECT DISTINCT "dataTime", "accountId" 
	FROM public."bAccountTransaction"
	WHERE "bAccountTransaction"."dataTime"::date > '2023-02-21'::date
	ORDER BY "accountId","dataTime" DESC
