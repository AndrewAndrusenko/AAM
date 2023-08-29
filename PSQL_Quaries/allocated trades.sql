SELECT id, qty, idtrade, idportfolio, id_order,dtrades_allocated.id_bulk_order 	FROM public.dtrades_allocated order by id desc
-- union 
-- select 0,sum(qty),idtrade,0,0,0 from dtrades_allocated GROUP by idtrade order by id_order desc;
-- DELETE from dtrades_allocated where dtrades_allocated.id_bulk_order=129
-- nextval('dtrades_id_seq'::regclass)
