SELECT 
(f_i_get_npv_dynamic.pos_pv - pl_costs_joined.current_fifo_position_cost + COALESCE(pl_costs_joined.profit_loss,0))::money AS total_pl,
(f_i_get_npv_dynamic.pos_pv - pl_costs_joined.current_fifo_position_cost)::money AS mtm_pl,
COALESCE(pl_costs_joined.profit_loss,0)::money as pl,
pl_costs_joined.current_fifo_position_cost::money,
pl_costs_joined.fifo_change_date,
f_i_get_npv_dynamic.* FROM f_i_get_npv_dynamic (
	ARRAY(SELECT portfolioname FROM dportfolios),
	'10/01/2023',
	now()::date,
	840)
LEFT JOIN LATERAL(
	SELECT * FROM f_fifo_get_cost_pl_period_portfoilos_v2(
		now()::date, 
		ARRAY(SELECT portfolioname FROM dportfolios)) 
	WHERE 
		f_fifo_get_cost_pl_period_portfoilos_v2.secid = f_i_get_npv_dynamic.secid
		AND f_fifo_get_cost_pl_period_portfoilos_v2.portfolioname = f_i_get_npv_dynamic.portfolioname
		AND f_fifo_get_cost_pl_period_portfoilos_v2.fifo_change_date  <= f_i_get_npv_dynamic.report_date
	ORDER BY f_fifo_get_cost_pl_period_portfoilos_v2.fifo_change_date DESC
	LIMIT 1
) AS pl_costs_joined ON TRUE
WHERE 
f_i_get_npv_dynamic.portfolioname='ACM002' 
AND f_i_get_npv_dynamic.secid NOTNULL
AND report_date>='12/01/2023'
ORDER BY 
portfolioname,
secid,
report_date