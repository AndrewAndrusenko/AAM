with fees_dataset as (
SELECT 
 coalesce(cash_moves.cash_flow,0) as cash_flow,
end_npv.portfolioname, 
end_npv.pos_pv, 
(end_npv.pos_pv - cash_moves.cash_flow)::money as pl,
end_npv.pos_pv - coalesce(cash_moves.cash_flow,0) - coalesce(fees_schedules.hwm,0) as pl_above_hwm,
fees_schedules.feevalue,
 coalesce(fees_schedules.hwm,0) as hwm
from public.f_i_get_npv_dynamic(
	array(select portfolioname from dportfolios),
	'11/01/2023', 
	'11/01/2023',
	840
) as end_npv
left join lateral (
select * from f_i_get_deposits_withdrawals_per_portfolios_on_date(	
	array(select portfolioname from dportfolios),
	'11/01/2023')
where "accountNo" isnull and  f_i_get_deposits_withdrawals_per_portfolios_on_date.portfolioname=end_npv.portfolioname
) as cash_moves on true
left join lateral (
 select feevalue,hwm,hwm_date,calc_start,calc_end from public.f_f_get_performance_fees_schedules(
	array(select portfolioname from dportfolios), 
	'10/01/2023', 
	'10/31/2023'
 ) 
 where f_f_get_performance_fees_schedules.portfolioname=end_npv.portfolioname
) as fees_schedules on true
where end_npv."accountNo" isnull
	)
select 
fees_dataset.portfolioname, 
fees_dataset.pos_pv::money, 
fees_dataset.cash_flow::money,
CASE 
WHEN fees_dataset.pl_above_hwm>0 THEN ROUND(fees_dataset.pl_above_hwm*fees_dataset.feevalue/100,2)
ELSE 0
END::money as fee_amount,
fees_dataset.pl::money,
fees_dataset.pl_above_hwm::money,
fees_dataset.feevalue,
fees_dataset.hwm::money
from fees_dataset