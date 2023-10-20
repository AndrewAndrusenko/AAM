-- FUNCTION: public.f_i_get_cross_rates(bigint[], date, numeric)

DROP FUNCTION IF EXISTS public.f_i_get_portfolios_list_by_strategy(text);

CREATE OR REPLACE FUNCTION public.f_i_get_portfolios_list_by_strategy (p_mp_strategy text)
    RETURNS TABLE(  
		idportfolio int,
		idstategy int,
		portfolioname char varying,
		strategy char varying,
		mp char varying,
		id_strategy_parent int) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN QUERY
SELECT
  dportfolios.idportfolio,
  dportfolios.idstategy,
  dportfolios.portfolioname,
  dstrategiesglobal.sname AS strategy,
  modelportfolios.sname AS mp,
  dstrategies_global_structure.id_strategy_parent
FROM
  dportfolios
  LEFT JOIN dstrategiesglobal ON dstrategiesglobal.id = dportfolios.idstategy
  LEFT JOIN dstrategies_global_structure ON dportfolios.idstategy = dstrategies_global_structure.id_strategy_parent
  LEFT JOIN dstrategiesglobal modelportfolios ON dstrategies_global_structure.id_strategy_child = modelportfolios.id::TEXT
WHERE
  modelportfolios.sname = p_mp_strategy
  OR dstrategiesglobal.sname = p_mp_strategy
ORDER BY
  portfolioname;

END;
$BODY$;

ALTER FUNCTION public.f_i_get_portfolios_list_by_strategy(text)
    OWNER TO postgres;
