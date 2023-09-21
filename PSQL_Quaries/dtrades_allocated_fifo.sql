with fifo_buy as(
SELECT id, trade_date,idtrade, tr_type, qty, qty_out, price_in, price_out, closed, idportfolio
	FROM public.dtrades_allocated_fifo
	where idportfolio=7 and idtrade!=522
	order by trade_date
),
qty_running_total as (
select *, sum(qty) over (order by trade_date asc rows between unbounded preceding and current row) as qty_total
from fifo_buy
),
record_above as ( select * from qty_running_total where qty_total>=51 order by qty_total asc limit 1)
select * from qty_running_total where qty_total<=51 or id=(select id from record_above)