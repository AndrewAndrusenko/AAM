SELECT 
dir.id,dp.portfolioname, dir.idportfolio, dir.restriction_type_id, dir.value, dir.param,
diro.object_code, diro.object_id, diro.object_description

	FROM public.d_i_restrictions dir
	LEFT JOIN public.d_i_restrictions_objects diro ON diro.id = dir.restriction_type_id
	LEFT JOIN public.dportfolios dp ON dir.idportfolio=dp.idportfolio
where dir.idportfolio=29

	