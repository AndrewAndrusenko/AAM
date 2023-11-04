-- FUNCTION: public.f_i_model_portfolios_select_mp_structure_for_accounts(bigint[])

DROP FUNCTION IF EXISTS public.f_i_model_portfolios_select_mp_structure_for_accounts(bigint[]);

CREATE OR REPLACE FUNCTION public.f_i_model_portfolios_select_mp_structure_for_accounts(
	p_idportfolios bigint[])
    RETURNS TABLE(mp_id int, id integer, code character varying, strategy_name character varying, mp_name character varying, mp_weight numeric, instrument character varying, instrument_weight numeric, instrument_corrected_weight numeric, total_type text, total_weight numeric) 
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
  dstrategiesglobal.sname AS strategy_name,
  modelportfolios.sname AS mp_name,
  dstrategies_global_structure.weight_of_child AS mp_weight,
  mp_structure.id_strategy_child AS instrumtent,
  mp_structure.weight_of_child AS instrument_weight,
  ROUND(
    mp_structure.weight_of_child * dstrategies_global_structure.weight_of_child / 100,
    4
  ) AS instrument_corrected_weight,
  MAX('MONEY') as total_type,
  100-SUM(  ROUND(
    mp_structure.weight_of_child * dstrategies_global_structure.weight_of_child / 100,
    4
  ) ) as total_weight
FROM
  dportfolios
  LEFT JOIN dstrategiesglobal ON dstrategiesglobal.id = dportfolios.idstategy
  LEFT JOIN dstrategies_global_structure ON dstrategies_global_structure.id_strategy_parent = dstrategiesglobal.id
  LEFT JOIN dstrategiesglobal modelportfolios ON dstrategies_global_structure.id_strategy_child::BIGINT = modelportfolios.id
  LEFT JOIN dstrategies_global_structure mp_structure ON mp_structure.id_strategy_parent = modelportfolios.id
WHERE
  idportfolio = ANY(p_idportfolios)
GROUP BY GROUPING SETS (  
  (dportfolios.idportfolio ,dportfolios.portfolioname,  dstrategiesglobal.sname,  modelportfolios.sname,  dstrategies_global_structure.weight_of_child,
   mp_structure.id_strategy_child, mp_structure.weight_of_child,modelportfolios.id),
  (dportfolios.idportfolio)
);
-- order by idportfolio;
 END; 
$BODY$;

ALTER FUNCTION public.f_i_model_portfolios_select_mp_structure_for_accounts(bigint[])
    OWNER TO postgres;
