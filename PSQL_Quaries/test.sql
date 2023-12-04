-- 	SELECT * FROM coupon_schedule
-- 	WHERE balances_per_dates."dataTime">=coupon_schedule.start_date 
-- 		AND balances_per_dates."dataTime"<=coupon_schedule.end_date 
-- 		AND balances_per_dates.secid = coupon_schedule.secid
  SELECT * FROM f_i_get_accured_interest_for_period_secidlist(
  	ARRAY['XS0993162683'],
	'10/24/2023','11/24/2023')
 