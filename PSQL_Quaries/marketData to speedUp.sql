SELECT 
DISTINCT ON (secid) secid, numtrades, value, open, low, high, close, volume, marketprice2, admittedquote, 
globalsource, sourcecode, tradedate 
FROM t_moexdata_foreignshares 
order by secid,tradedate desc
