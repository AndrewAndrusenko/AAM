INSERT INTO public.dorders(
	 generated, type, secid, qty, price, amount, qty_executed, status, parent_order, id_portfolio, order_type, idcurrency, child_orders, ordertype)
select now()::timestamp without time zone,order_type,secid,order_qty,mtm_rate,ABS(order_amount),0,'created',null,idportfolio,0, main_currency_code,null,'Client' from f_i_get_portfolios_structure_detailed_data(
	array['acm002','ccm002','ccm003','ccm004','icm002','icm011','icm012','icm013','icm014','icm016','icm017','vip001','vip002','vip003
','vpc001','vpc003','vpc004','vpc005','vpc006','vpi001','vpi003','vpi005','vpi006'],
	'2023-10-17T15:35:31.307Z',840)
	where 
	order_qty notnull 
	AND order_qty!=0
	AND order_type notnull
	AND secid='GOOG-RM'
