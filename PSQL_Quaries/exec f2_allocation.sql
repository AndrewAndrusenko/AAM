
WITH alloc as (INSERT INTO public.dtrades_allocated(qty, idtrade, idportfolio, id_order,id_bulk_order) 
SELECT corrected_qty,101,id_portfolio,id,parent_order FROM f2_orders_allocation(30,ARRAY[130,131]) RETURNING *) 
 SELECT COALESCE(id_order,id_bulk_order,idtrade) as id_joined,id_order,id_bulk_order,idtrade, sum(alloc.qty) AS allocated 
              FROM alloc
GROUP BY  GROUPING SETS ((id_order),(id_bulk_order),(idtrade)) 