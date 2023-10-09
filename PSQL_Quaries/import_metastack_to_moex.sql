INSERT INTO public.t_moexdata_foreignshares(
	boardid, secid, open, low, high,  close, volume, legalcloseprice, waprice,globalsource, sourcecode, tradedate)
	select exchange as boardid, secid,open,low, high,  close, volume, adj_close, adj_close,  globalsource, sourcecode, date as tradedate 
	from t_marketstack_eod
	left join "aInstrumentsCodes" on( "aInstrumentsCodes".code=t_marketstack_eod.symbol and mapcode='msFS')