-- Constraint: cFK_dStrategiesGloablCascadeDel

-- ALTER TABLE IF EXISTS public.dstrategies_global_structure DROP CONSTRAINT IF EXISTS "cFK_dStrategiesGloablCascadeDel";

ALTER TABLE IF EXISTS public.dstrategies_global_structure
    ADD CONSTRAINT "cFK_dStategiesStructure_ChildID" FOREIGN KEY (id_strategy_child)
    REFERENCES public.dstrategiesglobal (id) MATCH SIMPLE
    ON UPDATE RESTRICT
    ON DELETE CASCADE
    NOT VALID;
