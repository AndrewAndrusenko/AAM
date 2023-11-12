 SELECT 
 coalesce(allocated_qty.allocated,0) as allocated,  dorders.qty-coalesce(allocated_qty.allocated, 0) as unexecuted, 
 dstrategiesglobal.sname as mp_name,
 secid, dorders.id, generated,
 dorders.type, dorders.secid, dorders.qty, price, amount, qty_executed, status, 
 ordertype, idcurrency,"dCurrencies"."CurrencyCode" as currencycode
 
 FROM public.dorders LEFT JOIN "dCurrencies" ON dorders.idcurrency = "dCurrencies"."CurrencyCodeNum"
 LEFT JOIN dstrategiesglobal ON dstrategiesglobal.id = dorders.mp_id 
 LEFT JOIN (
	 SELECT id_bulk_order,
	 sum(dtrades_allocated.qty) AS allocated 
	 FROM public.dtrades_allocated where id_bulk_order=452
	 group by id_bulk_order)  
	 as allocated_qty on allocated_qty.id_bulk_order=dorders.id 
 where dorders.id=452
 
