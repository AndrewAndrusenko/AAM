-- FUNCTION: public.trg_f_dfees_schedules_insert()

-- DROP FUNCTION IF EXISTS public.trg_f_dfees_schedules_insert();

CREATE OR REPLACE FUNCTION public.trg_f_dfees_schedules_insert()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF
AS $BODY$
BEGIN
   IF EXISTS (
		SELECT dfees_transactions.id_fee_main
			FROM public.dfees_transactions
			WHERE 
		    dfees_transactions.id_fee_main=new.id_fee_main			
		   LIMIT 1
	   )  THEN
      RAISE EXCEPTION USING MESSAGE = 'There are created fees calculations fee id '||NEW.id_fee_main;
   END IF;
   IF EXISTS (
		SELECT 
		idfee_scedule 
		FROM public.dfees_schedules
		WHERE 
			dfees_schedules.id_fee_main=NEW.id_fee_main
			AND NEW.schedule_range&&schedule_range
		    AND dfees_schedules.idfee_scedule!=NEW.idfee_scedule
		LIMIT 1
	   )  THEN
      RAISE EXCEPTION USING MESSAGE = 'There is a range overlaping a new one for fee id '||NEW.id_fee_main;
   END IF;
   RETURN NEW;
END
$BODY$;

ALTER FUNCTION public.trg_f_dfees_schedules_insert()
    OWNER TO postgres;
