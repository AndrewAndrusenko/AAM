INSERT INTO public.dtrades_allocated(qty, idtrade, idportfolio, id_order)
	
select corrected_qty,100,id_portfolio,id from f_orders_allocation(10,ARRAY[121])

