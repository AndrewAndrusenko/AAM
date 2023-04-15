SELECT sourcecode, tradedate,count(boardid)
	FROM public.t_moexdata_foreignshares
	where sourcecode NOTNULL
	group by t_moexdata_foreignshares.sourcecode, tradedate
	