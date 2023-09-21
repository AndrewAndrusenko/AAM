INSERT INTO public.dorders(
	generated, type, secid, qty, price, amount, qty_executed, status, parent_order, id_portfolio, order_type, idcurrency, child_orders, ordertype)
	SELECT  now(), type, secid, qty+2, price, ROUND((qty+2)*price,2), qty_executed, status, null, id_portfolio, order_type, idcurrency, child_orders, ordertype
	FROM public.dorders
	where secid='GOOG-RM' and type='SELL' and ordertype='Client'