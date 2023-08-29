SELECT SUM (orders_unexecuted.unexecuted) FROM (
	SELECT dorders.id, dorders.generated, dorders.id_portfolio, dorders.secid, dorders.qty - allocation.allocated as unexecuted, dorders.qty,allocation.allocated, dorders.parent_order
		FROM public.dorders 
		LEFT JOIN (SELECT id_order, sum(dtrades_allocated.qty) AS allocated
				   from public.dtrades_allocated 
				   where dtrades_allocated.id_bulk_order = ANY(ARRAY[127,128])
				   group by id_order) as allocation 
				   ON dorders.id = allocation.id_order
		WHERE dorders.parent_order = any(array[128,127])
	) AS orders_unexecuted