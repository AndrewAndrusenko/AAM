DROP FUNCTION IF EXISTS public.f_i_model_portfolios_select_mp_structure_for_accounts(bigint[]);

CREATE OR REPLACE FUNCTION public.f_i_model_portfolios_select_mp_structure_for_accounts(
	p_idportfolios bigint[])
    RETURNS TABLE(  
		id numeric,
		code char varying,
		strategy_name char varying,
		mp_name char varying,
		mp_weight numeric,
		instrument char varying,
		instrument_weight numeric,
		instrument_corrected_weight numeric
	)
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
SELECT
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
  ) AS instrument_corrected_weight
FROM
  dportfolios
  LEFT JOIN dstrategiesglobal ON dstrategiesglobal.id = dportfolios.idstategy
  LEFT JOIN dstrategies_global_structure ON dstrategies_global_structure.id_strategy_parent = dstrategiesglobal.id
  LEFT JOIN dstrategiesglobal modelportfolios ON dstrategies_global_structure.id_strategy_child::BIGINT = modelportfolios.id
  LEFT JOIN dstrategies_global_structure mp_structure ON mp_structure.id_strategy_parent = modelportfolios.id
WHERE
  idportfolio = ANY(p_idportfolios);
  
$BODY$;

ALTER FUNCTION public.f_i_model_portfolios_select_mp_structure_for_accounts(bigint[])
    OWNER TO postgres;
