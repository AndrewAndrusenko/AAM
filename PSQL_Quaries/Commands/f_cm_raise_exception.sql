-- FUNCTION: public.f_delete_bulk_orders(bigint[])

-- DROP FUNCTION IF EXISTS public.f_cm_raise_exception(bigint[]);

CREATE OR REPLACE FUNCTION public.f_cm_raise_exception(
	p_message_text,p_condition boolean)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000
exception
AS $BODY$
BEGIN
RETURN query
WITH deleted_bulk_orders as (DELETE FROM dorders WHERE dorders.id=ANY ($1) RETURNING *),
     updated_client_orders as (UPDATE dorders SET parent_order = null WHERE dorders.parent_order = ANY (SELECT deleted_bulk_orders.id FROM deleted_bulk_orders) RETURNING *)
SELECT  deleted_bulk_orders.id,'deleted' as action, 'Bulk' as ordertype FROM deleted_bulk_orders 
UNION 
SELECT updated_client_orders.id, 'updated' as action,'Client' as ordertype FROM updated_client_orders;
END;
$BODY$;

ALTER FUNCTION public.f_delete_bulk_orders(bigint[])
    OWNER TO postgres;
