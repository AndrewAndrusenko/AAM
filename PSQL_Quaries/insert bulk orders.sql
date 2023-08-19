INSERT INTO dorders (type, secid, qty, price, amount, status,  order_type, idcurrency, child_orders)
SELECT type, secid, SUM(qty) as qty, price, SUM(amount) as amount, status, order_type, idcurrency, array_agg(id) as child_orders
	FROM public.dorders 
	where secid in ('GOOG-RM','SU26223RMFS6')
	group by type, secid, price,idcurrency,status,order_type

	