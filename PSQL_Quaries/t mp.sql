select 
dportfolios.idportfolio as id, dportfolios.portfolioname as code,
dstrategiesglobal.sname as strategy_name,
modelportfolios.sname as mp_name,
dstrategies_global_structure.weight_of_child as mp_weight,
mp_structure.id_strategy_child as instrumtent,
mp_structure.weight_of_child as instrument_weight,
round(mp_structure.weight_of_child*dstrategies_global_structure.weight_of_child/100,4) as instrument_corrected_weight

from dportfolios
left join dstrategiesglobal on dstrategiesglobal.id = dportfolios.idstategy
left join dstrategies_global_structure ON dstrategies_global_structure.id_strategy_parent = dstrategiesglobal.id
left join dstrategiesglobal modelportfolios  ON dstrategies_global_structure.id_strategy_child::bigint = modelportfolios.id
left join dstrategies_global_structure mp_structure  ON mp_structure.id_strategy_parent = modelportfolios.id


where idportfolio = 2