-- FUNCTION: public.f_bcurrentturnoversandbalncesnotclosed(date)

DROP FUNCTION IF EXISTS public.f_create_bulk_orders(int[]);

CREATE OR REPLACE FUNCTION public.f_create_bulk_orders(
	child_orders int[])
    RETURNS TABLE("id" numeric) 
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
 --open transaction
BEGIN;

--avoid concurrent writes
LOCK dorders IN ROW SHARE MODE;

--using a writable cte to do the dirty job
WITH bulk_orders AS (
	INSERT INTO dorders (type, secid, qty, price, amount, status,  order_type, idcurrency, child_orders)
		SELECT type, secid, SUM(qty) as qty, price, SUM(amount) as amount, status, order_type, idcurrency, array_agg(id) as child_orders
		FROM public.dorders 
		where id = ANY (child_orders) and parent_order ISNULL AND child_orders ISNULL
		group by type, secid, price,idcurrency,status,order_type
		RETURNING id,child_orders
)
update dorders set parent_order = d2.parent_order_new 
FROM (
	select id, d1.parent_order_new from dorders 
	INNER join (SELECT id as parent_order_new,child_orders FROM bulk_orders) as d1 on dorders.id =ANY(d1.child_orders)
)  
d2 where dorders.id=d2.id;

--end transaction
COMMIT;

select id from dorders where id = ANY(child_orders);
$BODY$;

ALTER FUNCTION public.f_create_bulk_orders(int[])
    OWNER TO postgres;
