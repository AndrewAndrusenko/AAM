-- FUNCTION: public.f_create_bulk_orders(bigint[])
-- 
-- DROP FUNCTION IF EXISTS public.f_orders_allocation(	trade_qty numeric,orders_for_allocation numeric[]);

CREATE OR REPLACE FUNCTION public.f_orders_allocation(
	trade_qty numeric,
    orders_for_allocation numeric[])
    RETURNS TABLE(id bigint , allocated_qty numeric, corrected_qty numeric,id_portfolio numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
DECLARE
details_allocation record;
allocation_ratio numeric;
BEGIN
SELECT trade_qty/sum(dorders.qty) INTO allocation_ratio from dorders where parent_order = any(orders_for_allocation);
return query 
WITH allocation as ( 
	SELECT dorders.id, dorders.generated, dorders.id_portfolio, dorders.secid, dorders.qty,dorders.qty*allocation_ratio as c1,round(dorders.qty*allocation_ratio) as allocated_qty
	FROM public.dorders 
	WHERE dorders.parent_order = any(orders_for_allocation)
),
allocation_details_for_correction as (select sum(allocation.allocated_qty) as allocated_qty_total, max(allocation.allocated_qty) as max_allocation from allocation)

select allocation.id, allocation.allocated_qty, 
case 
when allocation_details_for_correction.max_allocation notnull then  allocation.allocated_qty + (trade_qty - allocation_details_for_correction.allocated_qty_total)
else allocation.allocated_qty
end as corrected_qty, allocation.id_portfolio from allocation 
left join allocation_details_for_correction on allocation.allocated_qty = allocation_details_for_correction.max_allocation ; 

END;
$BODY$;

ALTER FUNCTION public.f_orders_allocation(
	trade_qty numeric,
    orders_for_allocation numeric[])
    OWNER TO postgres;
