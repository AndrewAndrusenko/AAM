select 
f_i_get_npv_dynamic.report_date,
f_i_get_npv_dynamic.portfolioname,
round(f_i_get_npv_dynamic.pos_pv * mfees_set.feevalue/100/365 ,2) as management_fee_amount,
f_i_get_npv_dynamic.pos_pv as npv,
mfees_set.fee_code,
mfees_set.calc_start as calculation_start,
mfees_set.calc_end as calculation_end,
mfees_set.period_start,
mfees_set.period_end,
mfees_set.schedule_range,
mfees_set.feevalue,
mfees_set.fee_type_value
from f_i_get_npv_dynamic(array(select portfolioname from dportfolios),(now() - '5 months'::interval)::date,now()::date,840)
left join lateral (
select * from f_f_get_management_fees_schedules(array(select portfolioname from dportfolios),(now() - '5 months'::interval)::date,now()::date)
	where
	f_f_get_management_fees_schedules.portfolioname = f_i_get_npv_dynamic.portfolioname
	and f_i_get_npv_dynamic.report_date >= f_f_get_management_fees_schedules.calc_start
	and f_i_get_npv_dynamic.report_date<=f_f_get_management_fees_schedules.calc_end
	and  f_f_get_management_fees_schedules.schedule_range @> pos_pv
) as mfees_set on true
where "accountNo" isnull
