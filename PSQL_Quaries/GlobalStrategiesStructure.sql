SELECT dstrategiesglobal.sname,dstrategies_global_structure.weight_of_child, dstrategiesglobal_2.sname, dstrategiesglobal_2.s_description weight_of_child,
	dstrategiesglobal.id, id_strategy_parent, id_strategy_child
	FROM public.dstrategies_global_structure LEFT join dstrategiesglobal 
	on dstrategiesglobal.id = dstrategies_global_structure.id_strategy_parent 
	LEFT join dstrategiesglobal as dstrategiesglobal_2 
	on dstrategiesglobal_2.id = dstrategies_global_structure.id_strategy_child