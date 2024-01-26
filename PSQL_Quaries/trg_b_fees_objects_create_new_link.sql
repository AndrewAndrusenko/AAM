-- FUNCTION: public.trg_b_fees_create_performance_fee()

-- DROP FUNCTION IF EXISTS public.trg_b_fees_objects_create_new_link();

CREATE OR REPLACE FUNCTION public.trg_b_fees_objects_create_new_link()
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
			dfees_objects.object_id=new.object_id and 
			dfees_main.fee_type=mf2.fee_type and
			dfees_objects.period_end>=new.period_start
		   limit 1
	   )  THEN
      RAISE EXCEPTION USING MESSAGE = 'There is fees schedule overlaps a new one for portfolio id '||NEW.object_id;
   END IF;
   RETURN NEW;
END
$BODY$;

ALTER FUNCTION public.trg_b_fees_objects_create_new_link()
    OWNER TO postgres;
