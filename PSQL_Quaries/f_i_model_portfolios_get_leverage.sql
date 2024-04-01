-- FUNCTION: public.f_i_model_portfolios_select_mp_structure_for_accounts(bigint[])

DROP FUNCTION IF EXISTS public.f_i_model_portfolios_get_leverage(numeric[]);

CREATE OR REPLACE FUNCTION public.f_i_model_portfolios_get_leverage(
	p_idportfolios numeric[])
    RETURNS TABLE(
		mp_id integer, 
		id integer, code character varying, 
		mp_name character varying, mp_weight numeric, mp_leverage_weight numeric,portfolio_leverage_by_mp numeric, leverage_restrction numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN QUERY
SELECT
  modelportfolios.id AS mp_id,
  dportfolios.idportfolio AS id,
  dportfolios.portfolioname AS code,
  modelportfolios.sname AS mp_name,
  dstrategies_global_structure.weight_of_child AS mp_weight,
  ROUND((100 - SUM(mp_structure.weight_of_child))*dstrategies_global_structure.weight_of_child/100,4)*-1 AS mp_leverage_weight,
  ROUND(restrictions.value*dstrategies_global_structure.weight_of_child/100,4) portfolio_leverage_by_mp,
  restrictions.value AS leverage_restrction

FROM
  dportfolios AS dportfolios
  LEFT JOIN dstrategiesglobal ON dstrategiesglobal.id = dportfolios.idstategy
  LEFT JOIN dstrategies_global_structure ON dstrategies_global_structure.id_strategy_parent = dstrategiesglobal.id
  LEFT JOIN dstrategiesglobal modelportfolios ON dstrategies_global_structure.id_strategy_child_integer = modelportfolios.id
  LEFT JOIN dstrategies_global_structure mp_structure ON mp_structure.id_strategy_parent = modelportfolios.id
  LEFT JOIN LATERAL (
	SELECT value FROM public.d_i_restrictions
	WHERE 
	  restriction_type_id=1 AND dportfolios.idportfolio = d_i_restrictions.idportfolio
  ) AS restrictions ON TRUE
  WHERE p_idportfolios ISNULL OR dportfolios.idportfolio = ANY(p_idportfolios)
  GROUP BY 
  dportfolios.idportfolio,modelportfolios.id,dportfolios.portfolioname,modelportfolios.sname,dstrategies_global_structure.weight_of_child,portleverage,restrictions.value;
END; 
$BODY$;

ALTER FUNCTION public.f_i_model_portfolios_get_leverage(numeric[])
    OWNER TO postgres;
select * from f_i_model_portfolios_get_leverage(array[7,11,25])