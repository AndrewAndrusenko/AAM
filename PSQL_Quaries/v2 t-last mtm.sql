with last_mtm_dates as (SELECT 
secid,
max(tradedate) filter  (where close notnull) as td
FROM t_moexdata_foreignshares 
group by secid
)
select 
tradedate,t_moexdata_foreignshares.boardid,
mmoexboards.is_primary,mmoexboards.board_title,
t_moexdata_foreignshares.secid,
close,
t_moex_boards.currency,
t_moex_boards.percentprice
from last_mtm_dates
left join t_moexdata_foreignshares on (last_mtm_dates.secid=t_moexdata_foreignshares.secid and last_mtm_dates.td=t_moexdata_foreignshares.tradedate)
left join mmoexboards on mmoexboards.boardid = t_moexdata_foreignshares.boardid
left join t_moex_boards on t_moex_boards.code = t_moexdata_foreignshares.boardid
where t_moexdata_foreignshares.secid=ANY(ARRAY['GOOG-RM','SU26223RMFS6','RU000A0JXTS9','TSLA-RM'])
and is_primary=1
-- where t_moexdata_foreignshares.secid=ANY(ARRAY['GOOG-RM'])

-- order by secid,tradedate desc
