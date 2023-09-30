select dportfolios.portfolioname::text as pt,
id, idtrade, tr_type, qty, qty_out, price_in::numeric, price_out, closed, trade_date, secid::text, generated, profit_loss, id_sell_trade, id_buy_trade
from dtrades_allocated_fifo 
left join dportfolios on dportfolios.idportfolio=dtrades_allocated_fifo.idportfolio
-- where idtrade=18994
where lower(dportfolios.portfolioname)='vpi003'
and secid='GOOG-RM'
-- where idtrade
order by trade_date::date desc ,closed desc, id_buy_trade desc,qty asc
