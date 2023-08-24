WITH total_orders as (
SELECT 35/sum(qty) as execution_ratio from dorders where parent_order = any(array[123,124])
), allocation as ( 
SELECT 
id, generated, type, secid, 
qty,qty*total_orders.execution_ratio as c1,
round(qty*total_orders.execution_ratio)
 allocated_qty, 
price, amount, qty_executed, status, parent_order, id_portfolio, order_type, idcurrency, child_orders, ordertype
	FROM public.dorders 
	CROSS JOIN total_orders
	WHERE parent_order = any(ARRAY[123,124])
)
-- select * from allocation
-- select max(allocated_qty)+(35-sum(allocated_qty)) as corrected_qty from allocation
select * from allocation order by allocated_qty desc limit 1
