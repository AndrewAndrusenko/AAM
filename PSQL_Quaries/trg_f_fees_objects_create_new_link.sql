-- FUNCTION: public.trg_f_fees_objects_create_new_link()

-- DROP FUNCTION IF EXISTS public.trg_f_fees_objects_create_new_link();

CREATE OR REPLACE FUNCTION public.trg_f_fees_objects_create_new_link()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF
AS $BODY$
BEGIN
   IF EXISTS (
		SELECT dfees_objects.id
			FROM public.dfees_objects
			left join dfees_main  ON dfees_main.id = dfees_objects.id_fee_main
			left join dfees_main as mf2 ON mf2.id = new.id_fee_main
			where 
		    dfees_objects.id !=new.id and
			dfees_objects.object_id=new.object_id and 
			dfees_main.fee_type=mf2.fee_type and
			daterange(dfees_objects.period_start, dfees_objects.period_end) && daterange(new.period_start, new.period_end)
		   limit 1
	   )  THEN
      RAISE EXCEPTION USING MESSAGE = 'There is a fees schedule overlaping a new one for portfolio id '||NEW.object_id;
   END IF;
   RETURN NEW;
END
$BODY$;

ALTER FUNCTION public.trg_f_fees_objects_create_new_link()
    OWNER TO postgres;
