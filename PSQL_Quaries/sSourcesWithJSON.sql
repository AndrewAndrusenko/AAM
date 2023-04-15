SELECT "sourceCode", "sourceName", 
(SELECT 
 ARRAY_AGG(
	json_build_object('code', description, 'id', "sourceCode", 'checked', false)) as segments 
 FROM "icMarketDataSources" 
 WHERE "icMarketDataSources"."sourceGlobal"="icMarketDataSourcesGlobal"."sourceCode")
	FROM public."icMarketDataSourcesGlobal"