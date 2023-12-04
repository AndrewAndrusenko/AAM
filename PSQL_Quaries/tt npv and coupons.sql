select 
ROUND(unredemeedvalue*couponrate/100*(report_date-start_date)/365,2) as accured,
round(mtm_rate*unredemeedvalue/100,2) + round(unredemeedvalue*couponrate/100*(report_date-start_date)/365,2) as dirty_price,
* from 
f_i_get_npv_dynamic_with_performance_data( Array(select dportfolios.portfolioname from dportfolios),'10/01/2023','11/15/2023')
LEFT JOIN LATERAL(
SELECT * FROM temp_coupon_schedule1
WHERE f_i_get_npv_dynamic_with_performance_data.report_date>=start_date 
	AND f_i_get_npv_dynamic_with_performance_data.report_date<=end_date 
	AND f_i_get_npv_dynamic_with_performance_data.secid = temp_coupon_schedule1.secid
) AS coupon ON TRUE
WHERE couponrate notnull and f_i_get_npv_dynamic_with_performance_data.secid='SU29008RMFS8' and balance notnull
order by portfolioname, report_date desc
