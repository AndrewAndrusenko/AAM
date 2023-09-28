insert into dorders (

	 generated, type, secid, qty, price, amount, qty_executed, status, parent_order, id_portfolio, order_type, idcurrency, child_orders, ordertype)

select 

	now(), type, secid, qty, price, amount, qty_executed, status, null, id_portfolio, order_type, idcurrency, child_orders, ordertype
from dorders where parent_order=213
