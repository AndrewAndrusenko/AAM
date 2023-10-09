select id,dportfolios.portfolioname::text as pt,
id_buy_trade,id_sell_trade, idtrade, tr_type,profit_loss, qty, qty_out,dtrades_allocated_fifo.idportfolio, price_in::numeric, price_out, closed, trade_date,out_date, secid::text, generated
from dtrades_allocated_fifo 
left join dportfolios on dportfolios.idportfolio=dtrades_allocated_fifo.idportfolio
-- where idtrade=18994
where lower(dportfolios.portfolioname)='vpc004'
and secid='RU000A0JXTS9'
-- where idtrade
order by out_date::date desc,trade_date::date,id_sell_trade desc,idtrade,qty asc
