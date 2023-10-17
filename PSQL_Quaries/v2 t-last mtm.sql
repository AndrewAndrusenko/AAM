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
 t_moex_boards.currency_code,
-- CASE WHEN t_moex_boards.percentprice=TRUE THEN 
-- ELSE t_moex_boards.currency_code
-- END,
t_moex_boards.percentprice
from last_mtm_dates
left join t_moexdata_foreignshares on (last_mtm_dates.secid=t_moexdata_foreignshares.secid and last_mtm_dates.td=t_moexdata_foreignshares.tradedate)
left join mmoexboards on mmoexboards.boardid = t_moexdata_foreignshares.boardid
left join t_moex_boards on t_moex_boards.code = t_moexdata_foreignshares.boardid
where t_moexdata_foreignshares.secid=ANY(select DISTINCT instrument from f_i_model_portfolios_select_mp_structure_for_accounts(ARRAY[7,2,25,29]))
and is_primary=1
-- where t_moexdata_foreignshares.secid=ANY(ARRAY['GOOG-RM'])

-- order by secid,tradedate desc
