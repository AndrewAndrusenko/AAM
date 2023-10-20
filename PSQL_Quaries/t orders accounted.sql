select 
 id_portfolio,secid,secid,type,parent_order,
sum(qty) as qty,
sum(coalesce(acc_qty.balance_qty,0)) as accounted,
sum(qty - coalesce(acc_qty.balance_qty,0)) as unaccounted_qty
from dorders
left join (select * from f_i_orders_accounted_qty(ARRAY[274,288])) as acc_qty on dorders.id=acc_qty.id_order
where qty - coalesce(acc_qty.balance_qty,0)!=0 and ordertype='Client'
group by grouping sets ((id_portfolio,secid,secid,type),(secid,type,parent_order))
order by  id_portfolio,secid,type