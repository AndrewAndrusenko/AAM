WITH fifo_portfolio AS (
SELECT 'Deal' as row_type, trade_date, idtrade,closed,id_buy_trade,  
	id_sell_trade,tr_type,CASE WHEN closed=false THEN qty - qty_out ELSE 0 END as position, qty, qty_out,  profit_loss
FROM public.dtrades_allocated_fifo
	LEFT JOIN dportfolios ON dportfolios.idportfolio= dtrades_allocated_fifo.idportfolio
WHERE dportfolios.portfolioname=UPPER('VPC004') AND secid='GOOG-RM' 
ORDER BY tr_type,trade_date 
)	
SELECT * FROM fifo_portfolio
UNION
SELECT 'Total',now()::date,0,false,0,0,0,SUM(position),0,0,0 FROM fifo_portfolio 
ORDER BY row_type,tr_type,trade_date 
