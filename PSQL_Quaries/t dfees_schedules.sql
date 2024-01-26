SELECT 
idfee_scedule, fee_type_value, feevalue, calculation_period, deduction_period, schedule_range, range_parameter, below_ranges_calc_type, id_fee_main, pf_hurdle, highwatermark
	FROM public.dfees_schedules
				where dfees_schedules.id_fee_main=5 
				and numrange(100,500000)&&schedule_range
-- 				and 
-- 			dfees_main.fee_type=mf2.fee_type and
-- 			dfees_objects.period_end>=new.period_start
-- 	order by idfee_scedule desc