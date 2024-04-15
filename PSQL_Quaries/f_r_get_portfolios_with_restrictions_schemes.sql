-- FUNCTION: public.f_f_get_portfolios_with_schedules(numeric, numeric)

DROP FUNCTION IF EXISTS public.f_r_get_portfolios_with_restrictions_schemes(numeric, numeric);

CREATE OR REPLACE FUNCTION public.f_r_get_portfolios_with_restrictions_schemes(
	p_idportfolios numeric[],
	p_portfolio_codes char varying[])
    RETURNS TABLE(
			id numeric, portfolioname character varying, idportfolio numeric, restriction_type_id numeric, 
			value numeric, param character varying,
			object_code character varying, object_id integer, object_description character varying) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN QUERY
SELECT 
	dir.id, dp.portfolioname, dir.idportfolio, dir.restriction_type_id, dir.value, dir.param,
	diro.object_code, diro.object_id, diro.object_description
FROM public.d_i_restrictions dir
LEFT JOIN public.d_i_restrictions_objects diro ON diro.id = dir.restriction_type_id
LEFT JOIN public.dportfolios dp ON dir.idportfolio=dp.idportfolio
WHERE (p_idportfolios ISNULL OR  dir.idportfolio = ANY(p_idportfolios)) AND  
			(p_portfolio_codes ISNULL OR  dp.portfolioname = ANY(p_portfolio_codes))
ORDER BY dir.id DESC;
	
END;

$BODY$;

ALTER FUNCTION public.f_r_get_portfolios_with_restrictions_schemes(numeric[], char varying[])
    OWNER TO postgres;
