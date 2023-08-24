SELECT id, qty, idtrade, idportfolio, id_order 	FROM public.dtrades_allocated
union 
select 0,sum(qty),idtrade,0,0 from dtrades_allocated GROUP by idtrade order by id_order desc;

-- DELETE from dtrades_allocated where idtrade=101