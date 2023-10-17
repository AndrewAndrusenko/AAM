with coupons_info as (
	SELECT 
	secid,
	MIN(date) FILTER (WHERE date > '10/09/2023')::date interest_period_end,
	MAX(date) FILTER (WHERE date < '10/09/2023')::date interest_period_start,
	('10/09/2023'::date - MAX(date) FILTER (WHERE date < '10/09/2023')) AS days_qty
	FROM public.mmoexcorpactions 
	GROUP BY secid
	HAVING  secid=ANY(select DISTINCT instrument from f_i_model_portfolios_select_mp_structure_for_accounts(ARRAY[7,2,25,29]))
)
SELECT
coupons_info.secid,
mmoexsecurities.shortname,
ROUND( (facevalue*couponrate/100*(EXTRACT(days FROM  days_qty)-1)/365)::numeric,4) as coupon_calc,
mmoexcorpactions.couponrate,mmoexcorpactions.couponamount,mmoexcorpactions.unredemeedvalue,
mmoexsecurities.facevalue, mmoexsecurities.faceunit,
coupons_info.interest_period_start,
coupons_info.days_qty
FROM coupons_info
LEFT JOIN mmoexsecurities ON coupons_info.secid=mmoexsecurities.secid
left join mmoexcorpactions on (coupons_info.secid=mmoexcorpactions.secid and coupons_info.interest_period_end=mmoexcorpactions.date and actiontype=1)