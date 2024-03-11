INSERT INTO public.t_moexdata_foreignshares (boardid, secid, legalcloseprice, close, globalsource, sourcecode, tradedate)
SELECT boardid,'SPOT-RM', 267, 267, globalsource, sourcecode, now()::date
	FROM public.t_moexdata_foreignshares
	where secid='TSLA-RM' and tradedate='2023-12-22'
	order by boardid desc