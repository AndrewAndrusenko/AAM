select
	object_id,
	dportfolios.portfolioname,
	dfees_main.id,
	fee_type,
	period_start,
	period_end,
	fee_type_value,
	feevalue,
	calculation_period,
	schedule_range,
	range_parameter,
	below_ranges_calc_type
from dfees_objects
left join dfees_main on dfees_objects.id_fee_main = dfees_main.id
left join dfees_schedules on dfees_schedules.id_fee_main = dfees_main.id
left join dportfolios on dfees_objects.object_id=dportfolios.idportfolio
where dfees_objects.fee_object_type=1