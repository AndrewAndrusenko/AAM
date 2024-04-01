-- insert into d_i_restrictions (idportfolio,restriction_type_id,value)
-- select dportfolios.idportfolio,restrictions.* from dportfolios cross join (
SELECT *
	FROM public.d_i_restrictions
	where restriction_type_id=1 and idportfolio=ANY(array[11,7,29])
	order by idportfolio 
	
-- ) restrictions
-- where dportfolios.idportfolio!=11;