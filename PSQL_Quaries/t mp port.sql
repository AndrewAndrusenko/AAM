select idportfolio,idstategy,portfolioname,dstrategiesglobal.sname as strategy, modelportfolios.sname as mp, dstrategies_global_structure.id_strategy_parent
from dportfolios
left join dstrategiesglobal on dstrategiesglobal.id=dportfolios.idstategy
left join dstrategies_global_structure on dportfolios.idstategy=dstrategies_global_structure.id_strategy_parent
left join dstrategiesglobal modelportfolios on dstrategies_global_structure.id_strategy_child=modelportfolios.id::text
where modelportfolios.sname='20Shares80Bonds' or dstrategiesglobal.sname='20Shares80Bonds'
order by portfolioname

-- SELECT id, sname, s_level_id, s_parent_id, s_description, s_benchmark_account FROM public.dstrategiesglobal where sname='ABonds'