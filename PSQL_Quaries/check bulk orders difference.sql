select id, qty, amount::int4,sqty,samount, sqty-qty as dqty, (samount-amount)::int4  as damount FROM dorders LEFT join (
select parent_order,secid,sum (qty) as sqty,sum(amount)::int4 as samount from dorders where parent_order>0 GROUP by parent_order,secid) as t1 
on t1.parent_order=dorders.id
where id_portfolio isnull