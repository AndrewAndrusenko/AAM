-- FUNCTION: public.trg_b_close_period_check()

-- DROP FUNCTION IF EXISTS public.trg_b_close_period_check();

CREATE OR REPLACE FUNCTION public.trg_b_close_period_check_delete()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF
AS $BODY$
BEGIN
   IF (OLD."dataTime")
    < (SELECT "firstOpenedDate" FROM public."gAppMainParams" LIMIT 1) THEN
      RAISE EXCEPTION 'Date is in closed period.Entry has been blocked';
   END IF;
   RETURN OLD;
END
$BODY$;

ALTER FUNCTION public.trg_b_close_period_check_delete()
    OWNER TO postgres;
