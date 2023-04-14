-- SELECT "sourceName", ARRAY (select * from "icMarketDataSources" where "icMarketDataSources"."sourceCode" = "icMarketDataSourcesGlobal"."sourceCode"  )
-- 	FROM public."icMarketDataSourcesGlobal"
select to_json(x)
from (
  select  "sourceName", json_agg("icMarketDataSources".*) as "segments"
  from "icMarketDataSourcesGlobal"
    left join "icMarketDataSources" on "icMarketDataSources"."sourceGlobal" = "icMarketDataSourcesGlobal"."sourceCode"
  group by "sourceName"
) x