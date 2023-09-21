-- select * from dtrades_allocated_fifo where id_buy_trade notnull and id_buy_trade=84
select id_buy_trade, count(qty), sum(qty_out) from dtrades_allocated_fifo where id_buy_trade notnull group by id_buy_trade
