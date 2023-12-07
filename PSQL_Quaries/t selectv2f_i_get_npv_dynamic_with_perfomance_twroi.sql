select rates_set.cross_rate,
v2f_i_get_npv_dynamic_with_perfomance_twroi.*
from v2f_i_get_npv_dynamic_with_perfomance_twroi( Array['ACM002'],'10/29/2023','11/28/2023',810)
-- from v2f_i_get_npv_dynamic_with_perfomance_twroi(array(select portfolioname from dportfolios),'05/01/2023','11/28/2023',840)
-- where portfolioname='ICM016'
left join lateral (
	SELECT * from public.f_i_get_cross_ratesfor_period_currencylist(array[978,840],'10/29/2023','11/28/2023',840)
	where 
	f_i_get_cross_ratesfor_period_currencylist.rate_date<=v2f_i_get_npv_dynamic_with_perfomance_twroi.report_date
	AND f_i_get_cross_ratesfor_period_currencylist.base_code=810
	
	order by  rate_date desc
	limit 1
	) as rates_set on true
order by portfolioname, report_date 