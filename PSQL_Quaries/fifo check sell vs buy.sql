-- select * from dtrades_allocated_fifo where id_buy_trade notnull and id_buy_trade=84
select id_buy_trade, count(dtrades_allocated_fifo.qty), dtrades_allocated.qty - sum(dtrades_allocated_fifo.qty_out) as check_qty  from dtrades_allocated_fifo
inner join dtrades_allocated on dtrades_allocated.id = dtrades_allocated_fifo.idtrade
where id_buy_trade notnull group by id_buy_trade,dtrades_allocated.qty 
HAVING dtrades_allocated.qty - sum(dtrades_allocated_fifo.qty_out)>0
