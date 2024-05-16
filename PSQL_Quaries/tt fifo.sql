SELECT 
bl.secid, 
bl.current_balance - COALESCE(fifo.fifo_rest,0) as diff, 
bl.current_balance,fifo.fifo_rest from public.f_i_get_portfolios_structure_detailed_data(
	ARRAY['acm002'], 
	now()::date, 
	840
) bl
LEFT join (
SELECT * FROM f_fifo_get_cost_detailed_data (now()::date,array['CLEARALL','ACM002'],null)
where idtrade isnull
) fifo ON fifo.secid = bl.secid 
-- where bl.current_balance - fifo.rest