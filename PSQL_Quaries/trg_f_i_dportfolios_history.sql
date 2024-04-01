-- FUNCTION: public.trg_f_i_dstrategies_global_structure_history()

-- DROP FUNCTION IF EXISTS public.trg_f_i_dportfolios_history();

CREATE OR REPLACE FUNCTION public.trg_f_i_dportfolios_history()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF
AS $BODY$

BEGIN
IF TG_OP = 'UPDATE' OR  TG_OP = 'INSERT' THEN  
	INSERT INTO public.dportfolios_history
	(idportfolio, idclient, idstategy, portfolioname, portleverage, "user", tr_date, type)
	VALUES (NEW.idportfolio, NEW.idclient, NEW.idstategy, NEW.portfolioname, NEW.portleverage, NEW.user_id, now()::timestamp without time zone, 1);
END IF;
IF TG_OP = 'UPDATE' THEN  
	INSERT INTO public.dportfolios_history
	(idportfolio, idclient, idstategy, portfolioname, portleverage, "user", tr_date, type)
	VALUES (OLD.idportfolio, OLD.idclient, OLD.idstategy, OLD.portfolioname, OLD.portleverage, OLD.user_id, now()::timestamp without time zone, 2);
END IF;
IF TG_OP = 'DELETE' THEN  
	INSERT INTO public.dportfolios_history
	(idportfolio, idclient, idstategy, portfolioname, portleverage, "user", tr_date, type)
	VALUES (OLD.idportfolio, OLD.idclient, OLD.idstategy, OLD.portfolioname, OLD.portleverage, OLD.user_id, now()::timestamp without time zone, 3);
	RETURN OLD;
END IF;

RETURN NEW;
END
$BODY$;

ALTER FUNCTION public.trg_f_i_dportfolios_history()
    OWNER TO postgres;
