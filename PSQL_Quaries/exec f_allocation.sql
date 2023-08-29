INSERT INTO public.dtrades_allocated(qty, idtrade, idportfolio, id_order,id_bulk_order)
select corrected_qty,103,id_portfolio,id,parent_order from f2_orders_allocation(15,ARRAY[127,128])

