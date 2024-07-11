-- FUNCTION: public.f_i_allocation_orders(numeric, numeric[])

DROP FUNCTION IF EXISTS public.f_i_allocation_orders(numeric, numeric[]);

CREATE OR REPLACE FUNCTION public.f_i_allocation_orders(
	trade_qty numeric,
	orders_for_allocation numeric[])
    RETURNS TABLE(mp_id bigint, id bigint, allocated_qty numeric, corrected_qty numeric, id_portfolio numeric, parent_order integer, ratio numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
DECLARE
details_allocation record;
allocation_ratio numeric;
BEGIN
return query
WITH unexecuted_orders AS ( 
	SELECT dorders.mp_id,dorders.id, dorders.generated, dorders.id_portfolio, dorders.secid,
	dorders.qty - COALESCE(allocation.allocated,0) as unexecuted, dorders.qty,allocation.allocated, dorders.parent_order
	FROM public.dorders 
	LEFT JOIN (SELECT id_order, sum(dtrades_allocated.qty) AS allocated
			   from public.dtrades_allocated 
			   where dtrades_allocated.id_bulk_order = ANY(orders_for_allocation)
			   group by id_order) as allocation 
			   ON dorders.id = allocation.id_order
	WHERE dorders.parent_order = any(orders_for_allocation)
), allocation_ratio AS (
	SELECT case when trade_qty/sum(unexecuted_orders.unexecuted)>1 then 1 else trade_qty/sum(unexecuted_orders.unexecuted) end as ratio from unexecuted_orders
), allocation AS (
	SELECT unexecuted_orders.mp_id,unexecuted_orders.id, unexecuted_orders.generated, unexecuted_orders.id_portfolio, unexecuted_orders.secid, 
	unexecuted_orders.unexecuted,
	round(unexecuted_orders.unexecuted*(select allocation_ratio.ratio from allocation_ratio)) as allocated_qty,(select allocation_ratio.ratio from allocation_ratio) as alloc_ratio, unexecuted_orders.parent_order
	FROM unexecuted_orders
), allocation_details_for_correction as (
	select sum(allocation.allocated_qty) as allocated_qty_total, max(allocation.allocated_qty) as max_allocation from allocation
)

select allocation.mp_id, allocation.id, allocation.allocated_qty, 
case 
when allocation_details_for_correction.allocated_qty_total notnull AND (select allocation_ratio.ratio from allocation_ratio) <1
then  allocation.allocated_qty + (trade_qty - allocation_details_for_correction.allocated_qty_total)
else allocation.allocated_qty
end as corrected_qty, allocation.id_portfolio,allocation.parent_order,allocation.alloc_ratio from allocation 
left join allocation_details_for_correction on allocation.allocated_qty = allocation_details_for_correction.max_allocation ; 

END;
$BODY$;

ALTER FUNCTION public.f_i_allocation_orders(numeric, numeric[])
    OWNER TO postgres;
