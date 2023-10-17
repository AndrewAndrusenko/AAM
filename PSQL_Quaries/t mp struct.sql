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
--   MAX('money') as total_type,
--   100-SUM(  ROUND(
--     mp_structure.weight_of_child * dstrategies_global_structure.weight_of_child / 100,
--     4
--   ) ) as total_weight
FROM
  dportfolios
  LEFT JOIN dstrategiesglobal ON dstrategiesglobal.id = dportfolios.idstategy
  LEFT JOIN dstrategies_global_structure ON dstrategies_global_structure.id_strategy_parent = dstrategiesglobal.id
  LEFT JOIN dstrategiesglobal modelportfolios ON dstrategies_global_structure.id_strategy_child::BIGINT = modelportfolios.id
  LEFT JOIN dstrategies_global_structure mp_structure ON mp_structure.id_strategy_parent = modelportfolios.id
WHERE
  idportfolio = ANY(ARRAY[2,7,11,25,29])
-- GROUP BY GROUPING SETS (  
-- 	(  dportfolios.idportfolio ,dportfolios.portfolioname,  dstrategiesglobal.sname,  modelportfolios.sname,  dstrategies_global_structure.weight_of_child,
--   mp_structure.id_strategy_child, mp_structure.weight_of_child),
-- 	(dportfolios.idportfolio))
-- order by idportfolio;