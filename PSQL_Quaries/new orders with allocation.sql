 SELECT  dorders.id, 
 dorders.secid, dorders.qty, 
 coalesce(allocated_qty.allocated,0) as allocated, 
 dorders.qty-coalesce(allocated_qty.allocated, 0) as unexecuted,
 mmoexsecuritytypes.security_group_name,mmoexsecuritytypes.security_type_name as secid_type,
 mmoexsecurities.name as secid_name, mmoexsecuritytypes.price_type, price, amount, qty_executed, status, parent_order, id_portfolio, dportfolios.portfolioname, 
 ordertype, idcurrency,"dCurrencies"."CurrencyCode" as currencycode, 0 as action, 0 as allocated, 0 as unexecuted 
 FROM public.dorders LEFT JOIN "dCurrencies" ON dorders.idcurrency = "dCurrencies"."CurrencyCodeNum" 
 LEFT JOIN (SELECT COALESCE(id_order,id_bulk_order) as id_joined,id_order,id_bulk_order, sum(dtrades_allocated.qty) AS allocated 
			   from public.dtrades_allocated 
			   group by  GROUPING SETS ((id_order),(id_bulk_order))
		   )  as allocated_qty on allocated_qty.id_joined=dorders.id
 LEFT JOIN dportfolios ON dorders.id_portfolio = dportfolios.idportfolio 
 LEFT JOIN mmoexsecurities  ON dorders.secid = mmoexsecurities.secid 
 LEFT JOIN mmoexsecuritytypes ON mmoexsecurities.type=mmoexsecuritytypes.security_type_name 
 ORDER BY dorders.id DESC;