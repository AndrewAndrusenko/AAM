SELECT id, code, currency, percentprice,t_moexdata_foreignshares.sourcecode
	FROM public.t_moex_boards
	left join t_moexdata_foreignshares ON t_moex_boards.code = t_moexdata_foreignshares.boardid