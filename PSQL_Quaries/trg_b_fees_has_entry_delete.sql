-- FUNCTION: public.trg_b_close_period_check_delete()

-- DROP FUNCTION IF EXISTS public.trg_b_fees_has_entry_delete();

CREATE OR REPLACE FUNCTION public.trg_b_fees_has_entry_delete()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF
AS $BODY$
BEGIN
   IF (OLD.id_b_entry) >0 THEN
      RAISE EXCEPTION 'Accounting has been created for the
	  fees transaction.They could be deleted only after removing related accounting transsaction';
   END IF;
   RETURN OLD;
END
$BODY$;

ALTER FUNCTION public.trg_b_fees_has_entry_delete()
    OWNER TO postgres;
