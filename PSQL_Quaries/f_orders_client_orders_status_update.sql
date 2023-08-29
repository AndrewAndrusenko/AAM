-- FUNCTION: public.f_delete_bulk_orders(bigint[])

-- DROP FUNCTION IF EXISTS public.f_delete_bulk_orders(bigint[]);

CREATE OR REPLACE FUNCTION public.f_orders_client_orders_status_update(
	)
    RETURNS TABLE(id bigint, status char varying) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN query
UPDATE dorders SET status = bulk_orders.status WHERE dorders.parent_order = bulk_orders.id RETURNING *)
END;
$BODY$;

ALTER FUNCTION public.f_orders_client_orders_status_update()
    OWNER TO postgres;
