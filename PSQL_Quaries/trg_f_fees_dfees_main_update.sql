-- FUNCTION: public.trg_f_fees_objects_create_new_link()

-- DROP FUNCTION IF EXISTS public.trg_f_fees_dfees_main_update();

CREATE OR REPLACE FUNCTION public.trg_f_fees_dfees_main_update()
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
      RAISE EXCEPTION USING MESSAGE = 'There are created fees calculations fee id '||NEW.id;
   END IF;
   RETURN NEW;
END
$BODY$;

ALTER FUNCTION public.trg_f_fees_dfees_main_update()
    OWNER TO postgres;
