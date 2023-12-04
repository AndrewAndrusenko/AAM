select 
mtm.tradedate as mtm_date,
* from dtrades_allocated
left join dtrades on dtrades_allocated.idtrade=dtrades.idtrade
left join lateral(
select * from t_moexdata_foreignshares
	where t_moexdata_foreignshares.tradedate<=dtrades.tdate
	and t_moexdata_foreignshares.secid=dtrades.tidinstrument
	order by tradedate desc
	limit 1
) as mtm on true