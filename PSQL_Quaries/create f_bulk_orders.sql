-- DROP FUNCTION IF EXISTS public.f_create_bulk_orders(bigint[]);

CREATE OR REPLACE FUNCTION public.f_create_bulk_orders(
	bigint[])
   RETURNS TABLE (secid character varying, qty NUMERIC, amount numeric)
	LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
BEGIN
RETURN query
WITH bulk_orders as (
	INSERT INTO dorders (type, secid, qty, price, amount, status,  order_type, idcurrency, child_orders)
		SELECT dorders.type, dorders.secid, SUM(dorders.qty) as qty, dorders.price, 
			   SUM(dorders.amount) AS amount, dorders.status, dorders.order_type, dorders.idcurrency, array_agg(dorders.id) AS child_array
		FROM public.dorders 
		WHERE dorders.id = ANY ($1) AND parent_order ISNULL 
		GROUP BY dorders.type, dorders.secid, dorders.price,dorders.idcurrency,dorders.status,dorders.order_type
	RETURNING *
    ), client_orders AS (
    UPDATE dorders SET parent_order = d2.parent_order_new 
	FROM (
		SELECT dorders.id, d1.parent_order_new 
		FROM dorders 
		INNER JOIN (SELECT bulk_orders.id as parent_order_new,bulk_orders.child_orders FROM bulk_orders) AS d1 ON dorders.id =ANY(d1.child_orders)) d2 
	WHERE dorders.id=d2.id
	RETURNING *)
SELECT   client_orders.secid, client_orders.qty , client_orders.amount  from client_orders;
END;
$BODY$;

ALTER FUNCTION public.f_create_bulk_orders(bigint[])
    OWNER TO postgres;
