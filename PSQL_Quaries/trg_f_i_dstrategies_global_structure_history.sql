-- FUNCTION: public.trg_f_fees_objects_create_new_link()

-- DROP FUNCTION IF EXISTS public.trg_f_i_dstrategies_global_structure_history();

CREATE OR REPLACE FUNCTION public.trg_f_i_dstrategies_global_structure_history()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF
AS $BODY$

BEGIN
IF TG_OP = 'UPDATE' OR  TG_OP = 'INSERT' THEN  
INSERT INTO public.dstrategies_global_structure_history
( id_strategy_parent, weight_of_child, id_strategy_child, id_strategy_child_integer, "user", tr_date, type)
VALUES (NEW.id_strategy_parent, NEW.weight_of_child, NEW.id_strategy_child, NEW.id_strategy_child_integer, 1, now()::timestamp without time zone, 1);
END IF;
IF TG_OP = 'UPDATE' THEN  
	INSERT INTO public.dstrategies_global_structure_history
	( id_strategy_parent, weight_of_child, id_strategy_child, id_strategy_child_integer, "user", tr_date, type)
	VALUES (OLD.id_strategy_parent, OLD.weight_of_child, OLD.id_strategy_child, OLD.id_strategy_child_integer, 1, now()::timestamp without time zone, 2);
END IF;
IF TG_OP = 'DELETE' THEN  
	INSERT INTO public.dstrategies_global_structure_history
	( id_strategy_parent, weight_of_child, id_strategy_child, id_strategy_child_integer, "user", tr_date, type)
	VALUES (OLD.id_strategy_parent, OLD.weight_of_child, OLD.id_strategy_child, OLD.id_strategy_child_integer, 1, now()::timestamp without time zone, 3);
	RETURN OLD;
END IF;

RETURN NEW;
END
$BODY$;

ALTER FUNCTION public.trg_f_i_dstrategies_global_structure_history()
    OWNER TO postgres;
