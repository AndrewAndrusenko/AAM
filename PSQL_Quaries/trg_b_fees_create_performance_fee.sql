-- FUNCTION: public.trg_b_fees_has_entry_delete()

-- DROP FUNCTION IF EXISTS public.trg_b_fees_create_performance_fee();

CREATE OR REPLACE FUNCTION public.trg_b_fees_create_performance_fee()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF
AS $BODY$
BEGIN
   IF (NEW.fee_type=2) AND 
	  EXISTS (
	   SELECT id FROM dfees_transactions 
		 WHERE fee_type=2 AND id_object=NEW.id_object AND fee_date>=new.fee_date
		 LIMIT 1
	   )  THEN
      RAISE EXCEPTION USING MESSAGE = 'There is created performance fee calculation after '||NEW.fee_date||' for portfolio id '||NEW.id_object;
   END IF;
   RETURN NEW;
END
$BODY$;

ALTER FUNCTION public.trg_b_fees_create_performance_fee()
    OWNER TO postgres;
