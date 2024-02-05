SELECT stt.id, id_strategy_parent, weight_of_child, id_strategy_child, id_strategy_child_integer, "user",dusers.login,dusers.accessrole, tr_date, type,
CASE
WHEN type=1 THEN 'New'
WHEN type=2 THEN 'Old'
WHEN type=3 THEN 'Delete'
END  as type_trans
	FROM public.dstrategies_global_structure_history stt
	LEFT  JOIN dusers ON stt."user" = dusers.id
	order by tr_date desc,type