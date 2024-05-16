SELECT 
 bl.idportfolio,
bl.secid, 
bl.current_balance - COALESCE(fifo.fifo_rest,0) as diff, 
bl.current_balance,fifo.fifo_rest from public.f_i_get_portfolios_structure_detailed_data(
	null, 
	now()::date, 
	840
) bl
LEFT join (
SELECT * FROM f_fifo_get_cost_detailed_data (now()::date,null,null)
where idtrade isnull
) fifo ON fifo.secid = bl.secid and bl.idportfolio=fifo.idportfolio
where bl.current_balance - COALESCE(fifo.fifo_rest,0)>0 and left(bl.secid,5)!='MONEY'