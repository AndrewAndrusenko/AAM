SELECT id, fee_object_type, object_id, id_fee_main, period_start, period_end, created, modified
	FROM public.dfees_objects
	order by object_id