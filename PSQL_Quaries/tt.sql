SELECT details, dclients.clientname as cpty_name ,
 mmoexsecurities.name as secid_name, dtrades.idtrade, qty, price, dclients.clientname as cpty, tdate, vdate, 
 allocated_qty.alloaction as allocatedqty,  trtype, tidinstrument,  accured_interest,   trade_amount,settlement_amount,
 settlement_rate
 FROM public.dtrades 
 LEFT JOIN (
	 SELECT dtrades_allocated.idtrade, sum (qty) as alloaction FROM  public.dtrades_allocated 
	 where  dtrades_allocated.idtrade=294985 GROUP BY dtrades_allocated.idtrade ) 
	 allocated_qty ON allocated_qty.idtrade=dtrades.idtrade 
	 LEFT JOIN dclients ON dclients.idclient = dtrades.id_cpty 
	 left join mmoexsecurities on mmoexsecurities.secid=dtrades.tidinstrument
	 where dtrades.idtrade=294985
ORDER BY dtrades.idtrade DESC;